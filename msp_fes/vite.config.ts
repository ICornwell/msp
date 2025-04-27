import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import type { Plugin } from 'vite'
import type { Adapter } from 'vite-plugin-mix'
import mixPlugin from 'vite-plugin-mix'

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
