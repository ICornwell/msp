import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commonExclude = [
  '**/node_modules/**',
  '**/dist/**',
  '**/distApi/**',
  '**/build/**',
  '**/.yarn/**',
];

export default defineConfig({
  test: {
    globals: true,
    root: __dirname,
    projects: [
      {
        test: {
          name: 'ui',
          environment: 'happy-dom',
          setupFiles: [path.resolve(__dirname, './src/ui/setupTests.ts')],
          css: true,
          include: [
            'src/ui/**/*.{test,spec}.{ts,tsx,js,jsx}',
            'integrationTests/ui/**/*.{test,spec}.{ts,tsx,js,jsx}',
          ],
          exclude: commonExclude,
          deps: {
            optimizer: {
              web: {
                enabled: true,
                include: [
                  '@emotion/react',
                  '@emotion/styled',
                  '@emotion/cache',
                  '@mui/material',
                  '@mui/system',
                  'react',
                  'react-dom',
                ],
              },
            },
          },
        },
      },
      {
        test: {
          name: 'node',
          environment: 'node',
          globals: true,
          include: [
            'src/uiApi/**/*.{test,spec}.{ts,tsx,js,jsx}',
            'uiApiProxy.{test,spec}.{ts,tsx,js,jsx}',
            'uiApiProxyHandler.{test,spec}.{ts,tsx,js,jsx}',
            'integrationTests/node/**/*.{test,spec}.{ts,tsx,js,jsx}',
          ],
          exclude: commonExclude,
        },
      },
    ],
  },
});
