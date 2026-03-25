import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { federation } from '@module-federation/vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'
import mix from 'vite-plugin-mix'  // temporarily disabled for BFF isolation test
import { sharedDeps, Ports } from 'msp_common'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svgr({ svgrOptions: {} }),
    mix.default({ handler: './uiApiProxyHandler.ts' }),  // BFF disabled
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
    dedupe: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@emotion/react',
      '@emotion/styled',
      '@emotion/cache',
      '@mui/styled-engine',
      '@azure/msal-browser',
      '@azure/msal-react',
      '@azure/msal-common',
    ],
    alias: {
      '__mf__virtual': path.resolve(__dirname, 'node_modules/__mf__virtual')
    },
    
  },
  optimizeDeps: {
    exclude: [
      'uiApi',
    ],
    // All federated shared packages must be pre-bundled in the FIRST
    // optimization pass, before any module is served. If any shared package
    // is discovered at serve-time instead, Vite runs a new optimization pass
    // with a new browserHash, while previously-served transforms still
    // reference the old hash — causing permanent pending requests.
    //
    // We derive the list directly from sharedDeps so it stays in sync
    // automatically when shared packages are added or removed.
    //
    // A few extra CJS packages that aren't in sharedDeps but are pulled in
    // as transitive deps and need esbuild interop are listed separately.
    include: [
      ...Object.keys(sharedDeps),
      // dev-only React runtime (not in sharedDeps, only used in dev mode)
      'react/jsx-dev-runtime',
      // CJS transitive deps of @emotion & React that esbuild must interop
      'hoist-non-react-statics',
      'react-is',
      '@emotion/is-prop-valid',
      // Directly imported in app source but not a federated shared dep.
      // Must be listed here — if discovered at serve-time they trigger a
      // second optimization pass which holds chunk requests mid-flight.
      '@mui/material/styles',
      'msp_common',
      'jose',    // transitive dep of msp_common dist
      'semver',  // transitive dep of msp_common dist
    ],
    needsInterop: [
      'hoist-non-react-statics'
    ],
    // Don't hold dep responses while Vite continues crawling. localSharedImportMap
    // and virtual:mf-exposes use dynamic imports Vite can't statically trace, so
    // the crawl never fully settles. With a single pre-complete optimization pass
    // all chunk files are on disk before the browser loads — safe to release immediately.
    holdUntilCrawlEnd: false,
    // Disable serve-time dependency discovery. Our include list above is
    // complete (all shared deps + direct imports). Without this, the MF
    // plugin's runtime alias causes registerMissingImport to fire at serve
    // time, which assigns depOptimizationProcessing.promise to a discovered
    // dep and triggers a full esbuild re-run (~950ms), holding all chunk
    // loads until it completes.
    noDiscovery: true,

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
    cors: false,
    port: Ports.core.uiWeb,
    open: false,
    watch: {
      // Exclude virtual module files written by the MF plugin at startup.
      // Without this, Vite's watcher fires HMR reload events for those writes
      // before the page finishes loading, causing an infinite reload loop.
      ignored: ['**/node_modules/__mf__virtual/**', '**/.__mf__temp/**'],
    },
  }
})
