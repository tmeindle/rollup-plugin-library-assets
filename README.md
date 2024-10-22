# rollup-plugin-library-assets

This plugin is for bundling component library modules which are to be imported in web applications that will ultimately be rebundled with rsbuild, webpack, vite, etc.  The main use case for this is to use css or sass modules for styling and css variables (--variables) for themeing while allowing the app bundler to treeshake and bundle only the styles required for the consumed library components.

It scans imports and copies assets such as css and sass stylesheets, fonts, and images relative to the importer's output location.  This preserves the module folder structure.  CSS and Sass stylesheets have their imports recursively scanned and any imported assets are also copied to the output folder in a relative fashion.  The filenames of assets and the import statements in the source are not changed.  This defers the bundling and shaking of these assets to the web application bundler which must be configured to handle the included library asset imports properly.

Notes:
* This plugin requires that the `preserveModules` output option be set to true.

* You should set the `preserveModulesRoot` to your root source folder.  The plugin bundler will exit with and error if anything outside of the root is imported.

* Since the plugin currently does not rewrite any import statements, it only supports relative imports and urls in js/ts code and stylesheets.  Those are imports or urls that start with `./` or `../.`  It does not support imports from root in stylesheets (i.e. paths starting with slash) or any aliased imports such as `import something from '~/components'` where tilda represents the module's src root.

## Usage

Import it and add it to your rollup config plugins array.

```javascript
// import commonjs, node resolve, and swc plugin //these are demonstration
import libraryAssets from 'rollup-plugin-library-assets';

export default {
  input: 'src/index.mjs',
  output: {
    // library assets plugin requires preserveModules
    preserveModules: true,
    preserveModulesRoot: 'src',
    dir: 'dist',
    format: 'esm',
  },
  plugins: [
    nodeResolve(/*...*/),
    commonJs(/*...*/),
    swc(/*...*/),
    libraryAssets(
      // these are all optional arguments shown with their default values
      
      // includes most common assets by default
      include: ['**/*.{css,scss,sass,svg,png,jpg,jpeg,gif,webp,woff,woff2,eot,ttf}'],
      
      // node_modules should always be external and exist outside of the module's root
      exclude: ['**/node_modules/**'],
      
      // set to 1 to see a list of files copied to output
      verbose: 0,
      
      // the number of files to copy at a time
      concurrency: 4,
    ),
  ],
};
```
