import plugin from './index.mjs';
export default {
  input: 'test/fixtures/includesFromJs/index.mjs',
  output: {
    preserveModules: true,
    preserveModulesRoot: 'test/fixtures/includesFromJs',
    dir: 'test/fixtures/includesFromJs/dist',
    format: 'esm',
  },
  plugins: [plugin()],
};
