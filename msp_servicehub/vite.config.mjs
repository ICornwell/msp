import { defineConfig } from 'vite'
import { federation } from '@module-federation/vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'

import mix from 'vite-plugin-mix'

import { sharedDeps } from 'msp_common'



// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svgr({ svgrOptions: {} }),
    mix.default({ handler: './uiApiProxyHandler.ts' }),

    federation({
      filename: 'remoteEntry.js',
      name: 'remote',
      exposes:{

      },
      shared: { ...sharedDeps }
    }),
    react({
      devTarget: 'es2022',
      tsDecorators: true,
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
        },
        transform: {
          react: {
            runtime: 'automatic',
            development: true,
            sourceMapsEnabled: true,
            sourceMap: true,
          }
        },
        experimental: {
          plugins: [
            ['@swc/plugin-styled-components', { displayName: true, ssr: true, sourceMapsEnabled: true }],
            ['@swc/plugin-emotion', { sourceMap: true, sourceMapsEnabled: true, autoLabel: 'dev-only', labelFormat: '[local]' }],
          ]
        }
      }
    })
  ],
  build: {
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: id => id.startsWith('uiApi/') || id.startsWith('dist_uiApi/')
    }
  },
  esbuild: {
    sourcemap: true,
    topLevelAwait: true,
    supported: {
      'top-level-await': true
    }
  },
  resolve: {
    external: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@mui/material",
      "@mui/system",
      "@mui/icons-material",
      "@mui/styled-engine",
      "@emotion/react",
      "@emotion/styled"
    ]
  },
  optimizeDeps: {
    exclude: ['uiApi'],
    include: ['react', 'react-dom'],
    force: true,
    esbuildOptions: {
      sourcemap: true,
      loader: {
        '.js': 'jsx',
        '.ts': 'tsx'
      }
    }
  },
  logLevel: 'info',
  clearScreen: true,
  server: {
    hmr: false,
    cors: false,
    port: 3000,
    open: true,
  }
})
