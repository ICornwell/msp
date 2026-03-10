import { defineConfig } from 'vite';
import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sharedDeps } from 'msp_common';

const mfPort = parseInt(process.env['VITE_PORT'] || '3002', 10);
const mfShared = sharedDeps as unknown as Record<string, string | { singleton?: boolean; requiredVersion?: string }>;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    svgr({ svgrOptions: {} }),
    federation({
      filename: 'actorwork_remoteEntry.js',
      name: 'actorwork',
      exposes: {
        './UserProfileFeature': './src/uiElements/features/blades/userProfile/UserProfileFeature.tsx',
      },
      shared: mfShared,
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
    alias: {
      '__mf__virtual': path.resolve(__dirname, 'node_modules/__mf__virtual'),
    },
  },
  optimizeDeps: {
    exclude: ['uiApi'],
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
