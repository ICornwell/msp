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
        '/UserProfileFeature': './src/uiElements/features/blades/userProfile/UserProfileFeature.tsx',
        './UserProfileFeature': './src/uiElements/features/blades/userProfile/UserProfileFeature.tsx',
      },
      name: 'actorwork',
      shared: mfShared
    }),
    react(),
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
      'msp_ui_common',
      'msp_ui_common/uiLib',
      'msp_ui_common/uiLib/components',
      'msp_ui_common/uiLib/contexts'
    ],
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@emotion/react',
      '@emotion/styled',
      '@emotion/cache',
      '@emotion/react/jsx-runtime',
      '@mui/styled-engine',
      'hoist-non-react-statics',
      'react-is',
      '@emotion/is-prop-valid'
    ],
    needsInterop: [
      'hoist-non-react-statics'
    ],
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
  },
});
