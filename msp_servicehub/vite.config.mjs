import { defineConfig } from 'vite'
import { federation } from '@module-federation/vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'

import { Ports, sharedDeps } from 'msp_common'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svgr({ svgrOptions: {} }),

    federation({
      filename: 'servicehub_remoteEntry.js',
      name: 'remote',
      exposes:{
        './AppCore': './src/uiElements/features/appCore/appCore.tsx',
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
    target: 'es2022',
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: id => id.startsWith('api/') || id.startsWith('distApi/')
    }
  },
  esbuild: {
    sourcemap: true,
    target: 'es2022',
    supported: {
      'top-level-await': true
    }
  },
  optimizeDeps: {
    exclude: ['uiApi'],
    esbuildOptions: {
      target: 'es2022',
      sourcemap: true,
      loader: {
        '.js': 'jsx',
        '.ts': 'ts'
      }
    }
  },
  logLevel: 'info',
  clearScreen: true,
  server: {
    hmr: false,
    cors: false,
    port: Ports.core.serviceHubMF,
    open: false,
  }
})
