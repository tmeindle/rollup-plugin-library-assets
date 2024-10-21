import fs from 'fs-extra';
import path, { dirname } from 'path';
import { createFilter } from 'rollup-pluginutils';
import parseCssUrls from 'css-url-parser';
import * as sass from 'sass';
import pLimit from 'p-limit';
import { green, greenBright, cyanBright } from 'colorette';
import postcss from 'postcss';
import postcssUrl from 'postcss-url';
import postcssScssSyntax from 'postcss-scss';
import { fileURLToPath } from 'url';

const copied = new Set();
const info = {};

export default function includeAssets(options) {
  const pluginConfig = {
    name: 'rollup-plugin-include-assets',
    include: options?.include ?? ['**/*.{css,scss,sass,svg,png,jpg,jpeg,gif,webp,woff,woff2,eot,ttf}'],
    exclude: options?.exclude ?? ['**/node_modules/**'],
    verbose: options?.verbose ?? 0,
    concurrency: options?.concurrency ?? 4,
  };

  const { include, exclude, verbose } = pluginConfig;

  const importedAssets = [];
  const seen = new Set();

  const isIncluded = createFilter(include, exclude);

  const isStyleSheet = function (module) {
    return /\.(s?css|sass)/g.test(module);
  };

  const isSass = function (module) {
    return /\.(scss|sass)/g.test(module);
  };

  const normalizePathSep = function (path) {
    return path.replaceAll('\\', '/');
  };

  const processPath = normalizePathSep(process.cwd());

  const getIncludedAssets = async function (i) {
    const importer = normalizePathSep(i);
    let assets = [];
    if (isSass(importer)) {
      let result = await sass.compileAsync(importer, {
        sourceMap: true,
        sourceMapIncludeSources: true,
        loadPaths: ['node_modules'],
      });
      const loadedUrls = result.loadedUrls;
      assets = loadedUrls.reduce((current, url) => {
        if (url.protocol !== 'file:') return current;
        const assetFile = normalizePathSep(fileURLToPath(url));
        if (!isIncluded(assetFile)) return current;
        return [
          ...current,
          {
            assetFile,
            from: importer,
          },
        ];
      }, []);
      const css = fs.readFileSync(importer).toString();
      result = await postcss([
        // postcssSass,
        postcssUrl({
          assetsPath: dirname(importer),
          basePath: dirname(importer),
          url: (url) => {
            if (url.pathname) {
              assets.push({
                assetFile: normalizePathSep(url.absolutePath),
                from: importer,
              });
            }
          },
        }),
      ]).process(css, {
        //map: { prev: result.map },
        from: importer,
        to: './styles.css',
        syntax: postcssScssSyntax,
      });
      return assets;
    }

    const css = fs.readFileSync(importer).toString();

    assets = [
      ...assets,
      ...parseCssUrls(css).reduce((current, url) => {
        // This plugin only includes relative urls.  We ignore data uris and external http/https urls.
        // It does not currently support imports from node_modules with ~ as that is a postcss option
        // It also does not support imports from root (i.e. paths starting with slash)
        if (/^(data:|https?:|~|\/)/g.test(url)) return current;
        const assetFile = normalizePathSep(path.resolve(path.dirname(importer), url));
        if (!isIncluded(assetFile)) return current;
        return [
          ...current,
          {
            assetFile,
            from: importer,
          },
        ];
      }, []),
    ];

    return assets;
  };

  return {
    name: pluginConfig.name,
    async resolveId(source, importer, options) {
      // get the default resolution
      const resolution = await this.resolve(source, importer, options);

      // if it doesn't resolve or is external just return it so rollup can deal with it
      if (!resolution || resolution.external || !isIncluded(resolution.id)) return resolution;

      const assetFile = normalizePathSep(resolution.id);
      const from = normalizePathSep(importer);

      if (seen.has(assetFile)) return { ...resolution, external: true };

      importedAssets.push({ assetFile, from });
      seen.add(assetFile);

      //we use a stack to recursively parse all css/sass included stylesheets
      if (isStyleSheet(assetFile)) {
        const stack = await getIncludedAssets(assetFile);
        while (stack.length > 0) {
          const { assetFile, from } = stack.shift();
          if (seen.has(assetFile)) continue;

          importedAssets.push({ assetFile, from });
          if (isStyleSheet(assetFile)) {
            stack.push(...(await getIncludedAssets(assetFile)));
          }
          seen.add(assetFile);
        }
      }

      // return the resolution with external set to true to tell rollup not to worry about
      // this import since we will copy the asset to the output when the build ends
      return { ...resolution, external: true };
    },

    async renderStart(outputOptions) {
      if (!outputOptions.preserveModules)
        this.error(`\n\n${pluginConfig.name} requires output.preserveModules to be enabled\n\n`);

      const outDir = normalizePathSep(outputOptions.dir);
      if (!info[outDir]) info[outDir] = {};

      info[outDir].renders = (info[outDir].renders ?? 0) + 1;
      const modulesRoot = normalizePathSep(outputOptions.preserveModulesRoot);

      const copyAsset = async function (assetToCopy) {
        const { assetFile, from } = assetToCopy;
        const dest = assetFile.replace(modulesRoot, outDir);

        if (copied.has(dest)) {
          if (verbose > 1) {
            if (!info[outDir].skippedLogs) info[outDir].skippedLogs = [];
            info[outDir].skippedLogs.push(
              cyanBright(`already copied: ${assetFile.replace(`${processPath}/`, '')} to ${dest}`),
            );
          }
          return;
        }

        if (!assetFile.startsWith(modulesRoot)) {
          throw new Error(
            `\n\nCannot include asset: ${assetFile} from ${from} because it is outside of the preserve modules root`,
          );
        }

        copied.add(dest);
        await fs.copy(assetFile, dest);

        info[outDir].copyCount = (info[outDir].copyCount ?? 0) + 1;

        if (verbose) {
          if (!info[outDir].copyLogs) info[outDir].copyLogs = [];
          info[outDir].copyLogs.push(cyanBright(`${assetFile.replace(`${processPath}/`, '')} to ${dest}`));
        }
      };

      const limit = pLimit(pluginConfig.concurrency);
      const promises = importedAssets.map((copyTarget) => limit(() => copyAsset(copyTarget)));
      await Promise.all(promises);
      info[outDir].renders = info[outDir].renders - 1;
    },

    async generateBundle(outputOptions) {
      const outDir = outputOptions.dir;

      if (info[outDir].renders === 0) {
        if (verbose > 0 && info[outDir].copyLogs) {
          info[outDir].copyLogs.forEach((log) => console.log(log));
        }
        if (verbose > 1 && info[outDir].skippedLogs) {
          info[outDir].skippedLogs.forEach((log) => console.log(log));
        }
        if (info[outDir].copyCount > 0 || verbose > 0) {
          console.log(
            `${green('Copied')} ${greenBright(info[outDir].copyCount)} ${green('assets to')} ${greenBright(outDir)}`,
          );
        }
      }
    },
  };
}
