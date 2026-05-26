import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  esbuild: {
    jsxInject: `import React from 'react'`,
  },
  test: {
    globals: true,
    root: path.resolve(__dirname),
    include: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/distUiLib/**',
    ],
    projects: [
      {
        esbuild: {
          jsxInject: `import React from 'react'`,
        },
        test: {
          name: 'msp_ui_common-ui',
          globals: true,
          environment: 'happy-dom',
          setupFiles: [path.resolve(__dirname, './src/uiLib/test/setup-vitest.ts')],
          include: [
            '**/*.test.tsx',
            '**/*.spec.tsx',
          ],
          exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/distUiLib/**',
          ],
        },
      },
      {
        test: {
          name: 'msp_ui_common-node',
          globals: true,
          environment: 'node',
          include: [
            '**/*.test.ts',
            '**/*.spec.ts',
          ],
          exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/distUiLib/**',
          ],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        'dist',
        'distUiLib',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
