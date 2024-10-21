import { join } from 'path';
const fixture = 'test/fixtures/includesFromJs';

export default {
  output: {
    preserveModules: true,
    preserveModulesRoot: join(process.cwd(), fixture),
    dir: `${fixture}/dist`,
    format: 'esm',
  },

  input: `${fixture}/index.mjs`,

  expected: [
    'assets/asset.svg',
    'styles/styles.css',
    'styles/styles.module.css',
    'styles/styles.scss',
    'styles/styles.module.scss',
  ],
};
