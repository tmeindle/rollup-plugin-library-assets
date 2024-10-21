import { existsSync, rmdirSync } from 'fs';
import path from 'path';
import plugin from './index.mjs';
import { rollup } from 'rollup';
import includesFromJsConfig from '../test/fixtures/includesFromJs/config.mjs';
import includesFromCssConfig from '../test/fixtures/includesFromCss/config.mjs';
import includesFromScssConfig from '../test/fixtures/includesFromScss/config.mjs';

const performTest = async (testConfig) => {
  if (existsSync(testConfig.output.dir)) {
    rmdirSync(testConfig.output.dir, {
      recursive: true,
    });
  }

  const bundle = await rollup({
    input: testConfig.input,
    plugins: [plugin()],
  });

  await bundle.generate({
    ...testConfig.output,
  });

  testConfig.expected.forEach((filePath) => {
    const outputFile = path.resolve(testConfig.output.dir, filePath);
    expect(existsSync(outputFile), `${outputFile} does not exist`).toBe(true);
  });
};

test('plugin includes assets from js files', async () => {
  await performTest(includesFromJsConfig);
});

test('plugin includes assets from css files', async () => {
  await performTest(includesFromCssConfig);
});

test('plugin includes assets from scss files', async () => {
  //process.chdir(includesFromScssConfig.output.preserveModulesRoot);
  //const currentDir = process.cwd();
  await performTest(includesFromScssConfig);
});
