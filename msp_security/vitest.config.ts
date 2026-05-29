import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commonExclude = [
  '**/node_modules/**',
  '**/dist/**',
  '**/distApi/**',
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
          setupFiles: [path.resolve(__dirname, './src/uiElements/setup-vitest.ts')],
          css: true,
          include: [
            'src/uiElements/**/*.{test,spec}.{ts,tsx,js,jsx}',
            'integrationTests/ui/**/*.{test,spec}.{ts,tsx,js,jsx}',
          ],
          exclude: commonExclude,
        },
      },
      {
        test: {
          name: 'node',
          environment: 'node',
          globals: true,
          include: [
            'src/activityElements/**/*.{test,spec}.{ts,tsx,js,jsx}',
            'src/apiElements/**/*.{test,spec}.{ts,tsx,js,jsx}',
            'src/data/**/*.{test,spec}.{ts,tsx,js,jsx}',
            'src/manifest/**/*.{test,spec}.{ts,tsx,js,jsx}',
            'integrationTests/node/**/*.{test,spec}.{ts,tsx,js,jsx}',
          ],
          exclude: commonExclude,
        },
      },
    ],
  },
});
