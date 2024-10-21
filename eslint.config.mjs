import globals from 'globals';
import pluginJs from '@eslint/js';

import prettierPlugin from 'eslint-plugin-prettier/recommended';

export default [
  {
    ignores: ['.prettierrc.js', '**/dist/**'],
  },
  {
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.test.*'],
    languageOptions: { globals: globals.jest },
  },
  {
    ...pluginJs.configs.recommended,
    ignores: ['test/fixtures/**'],
  },
  prettierPlugin,
];
