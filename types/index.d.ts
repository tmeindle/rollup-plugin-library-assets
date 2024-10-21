import { Plugin } from 'rollup'

export interface RollupPluginLibraryAssetsOptions{
  include?: string[],
  exclude?: string[],
  verbose?: 0 | 1 | 2,
  concurrency?: number,
}

export default function includeAssets(options?: RollupPluginLibraryAssetsOptions): Plugin
