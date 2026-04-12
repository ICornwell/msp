import { defineConfig } from 'vite';
import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sharedDeps } from 'msp_common';

const mfPort = parseInt(process.env['VITE_PORT'] || '3003', 10);
const mfShared = sharedDeps ;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    svgr({ svgrOptions: {} }),
    federation({
      filename: 'actorwork_remoteEntry.js',
      exposes: {
        './UserWorkListFeature': './src/uiElements/features/tabs/workList/UserWorkListFeature.tsx',
        './UserProfileFeature': './src/uiElements/features/blades/userProfile/UserProfileFeature.tsx',
      },
      name: 'actorwork',
      shared: mfShared
    }),
    react(),
    // Strip shared deps from optimizeDeps.include after all plugins have run.
    // @vitejs/plugin-react-swc (and others) add react/jsx-dev-runtime etc. to
    // include via their config hooks. If those deps end up in .vite/deps,
    // Vite's importAnalysis rewrites remote source imports directly to the
    // .vite/deps URL, bypassing the MF alias → loadShare redirect entirely.
    // This plugin removes them so .vite/deps never contains shared packages.
    {
      name: 'mf-remote-strip-shared-from-deps',
      enforce: 'post',
      configResolved(config) {
        const sharedKeys = new Set(Object.keys(mfShared));
        if (config.optimizeDeps.include) {
          config.optimizeDeps.include = config.optimizeDeps.include.filter(
            id => !sharedKeys.has(id)
          );
        }
      }
    },
  ],
  build: {
    target: 'es2022',
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: (id) => id.startsWith('api/') || id.startsWith('distApi/'),
    },
  },
  esbuild: {
    target: 'es2022',
    sourcemap: true,
    supported: {
      'top-level-await': true,
    },
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
    ],
    alias: {
      '__mf__virtual': path.resolve(__dirname, 'node_modules/__mf__virtual'),
    },
  },
  optimizeDeps: {
    exclude: [
      'uiApi',
      // All federated shared deps must be EXCLUDED on a pure remote.
      // Including them in .vite/deps causes Vite's importAnalysis to
      // rewrite 'react' (etc.) directly to the remote's .vite/deps URL,
      // bypassing the MF alias → loadShare → host's instance entirely.
      // Excluding them forces all imports through the alias customResolver
      // which redirects to the loadShare module so the host's instances
      // are used (singleton sharing actually works).
      ...Object.keys(mfShared),
    ],
    include: [
      // @module-federation/runtime is NOT a shared dep — it's needed by
      // the loadShare virtual modules themselves, so it must be pre-bundled.
      '@module-federation/runtime',
      // CJS transitive deps the remote's own non-shared code may pull in.
      'hoist-non-react-statics',
      'react-is',
      '@emotion/is-prop-valid',
    ],
    needsInterop: [
      'hoist-non-react-statics'
    ],
    holdUntilCrawlEnd: false,
    noDiscovery: true,
    esbuildOptions: {
      target: 'es2022',
      sourcemap: true,
      supported: {
        'top-level-await': true,
      },
      loader: {
        '.js': 'jsx',
        '.ts': 'ts',
      },
    },
  },
  logLevel: 'info',
  clearScreen: true,
  server: {
    hmr: false,
    cors: false,
    port: mfPort,
    open: false,
    watch: {
      ignored: ['**/node_modules/__mf__virtual/**', '**/.__mf__temp/**'],
    },
  },
});
