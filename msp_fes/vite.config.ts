import { defineConfig, formatPostcssSourceMap } from 'vite'
import preact from '@preact/preset-vite'
import type { Plugin } from 'vite'
import type { Adapter } from 'vite-plugin-mix'
import mixPlugin from 'vite-plugin-mix'
import { filter } from 'compression'
import { inc } from 'semver'
import ts from 'typescript'
import { vitePluginTypescriptTransform } from 'vite-plugin-typescript-transform'

interface MixConfig {
  handler: string
  adapter?: Adapter | undefined
}

type MixPlugin = (config: MixConfig) => Plugin

interface Mix {
  default: MixPlugin
}

const mix = (mixPlugin as unknown as Mix).default

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vitePluginTypescriptTransform({
      enforce: 'pre',
      filter: {
        files: {
          include: /\.ts$/,
        }
      },
      tsconfig: {
        override: {
          sourceMap: true,
          target: ts.ScriptTarget.ES2021
        }
      }
    }),
    preact(),
    mix({
      handler: './src/bffApi/api.ts',
      }),
    ],

  server: {
    port: 3000,
    open: true,
  }
})
