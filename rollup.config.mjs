import { isAbsolute } from 'path';
import { copy, remove } from 'fs-extra';

export default {
  input: 'src/index.mjs',
  output: [
    {
      dir: 'dist',
      format: 'esm',
      entryFileNames: '[name].mjs',
      chunkFileNames: '[name]-[hash].mjs',
    },
    {
      dir: 'dist',
      format: 'cjs',
      entryFileNames: '[name].cjs',
      chunkFileNames: '[name]-[hash].cjs',
    },
  ],
  plugins: [
    {
      async buildStart() {
        await remove('./dist');
      },
    },
    {
      async renderStart() {
        await copy('types/index.d.ts', 'dist/index.d.ts');
      },
    },
  ],
  external: (id) => !id.startsWith('.') && !isAbsolute(id),
};
