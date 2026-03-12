import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { federation } from '@module-federation/vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'
import mix from 'vite-plugin-mix'
import { sharedDeps, Ports } from 'msp_common'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svgr({ svgrOptions: {} }),
    mix.default({ handler: './uiApiProxyHandler.ts' }),
    federation({
      name: 'host',
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
      external: id => id.startsWith('uiApi/') || id.startsWith('dist_uiApi/')
    }
  },
  esbuild: {
    target: 'es2022',
    sourcemap: true,
    supported: {
      'top-level-await': true
    }
  },
  resolve: {
    alias: {
      '__mf__virtual': path.resolve(__dirname, 'node_modules/__mf__virtual')
    },
    
  },
  optimizeDeps: {
    exclude: [
      'uiApi'
    ],
    include: [
      'react',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-dom',
      'react-dom/client',
      '@mui/material',
      '@mui/system',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled'
    ],
    esbuildOptions: {
      target: 'es2022',
      sourcemap: true,
      supported: {
        'top-level-await': true
      },
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
    port: Ports.core.uiWeb,
    open: false,
  }
})
