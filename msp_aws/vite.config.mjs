import { defineConfig } from 'vite';
import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sharedDeps } from 'msp_common';

const mfPort = parseInt(process.env['VITE_PORT'] || '3005', 10);
const mfShared = sharedDeps;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    svgr({ svgrOptions: {} }),
    federation({
      filename: 'aws_remoteEntry.js',
      exposes: {
        './AwsResourcesFeature': './src/uiElements/features/tabs/awsResources/AwsResourcesFeature.tsx',
      },
      name: 'aws',
      shared: mfShared,
    }),
    react(),
    {
      name: 'mf-remote-strip-shared-from-deps',
      enforce: 'post',
      configResolved(config) {
        const sharedKeys = new Set(Object.keys(mfShared));
        if (config.optimizeDeps.include) {
          config.optimizeDeps.include = config.optimizeDeps.include.filter((id) => !sharedKeys.has(id));
        }
      },
    },
  ],
  build: {
    target: 'es2022',
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: (id) => id.startsWith('activityElements/') || id.startsWith('distApi/'),
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
      'activityElements',
      ...Object.keys(mfShared),
    ],
    include: [
      '@module-federation/runtime',
      'hoist-non-react-statics',
      'react-is',
      '@emotion/is-prop-valid',
    ],
    needsInterop: ['hoist-non-react-statics'],
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
