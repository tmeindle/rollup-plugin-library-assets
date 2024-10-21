import { join } from 'path';
const fixture = 'test/fixtures/includesFromScss';

export default {
  output: {
    preserveModules: true,
    preserveModulesRoot: join(process.cwd(), fixture),
    dir: `${fixture}/dist`,
    format: 'esm',
  },

  input: `${fixture}/index.mjs`,

  expected: [
    'assets/fonts/asset.ttf',
    'assets/asset.png',
    'styles/nested.scss',
    'styles/nested.url.scss',
    'styles.scss',
  ],
};
