import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import babel from 'vite-plugin-babel'

export default defineConfig({
  plugins: [
    {
      name: 'debug-module-resolution',
      resolveId(id, importer) {
        console.log(`Resolving: ${id} from ${importer}`);

        return null;
      }
    },
    // React plugin with Emotion support
    react({
      jsxRuntime: 'react',
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: [
         // '@emotion/babel-plugin',
          // Add decorators support
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          ['@babel/plugin-proposal-class-properties', { loose: true }]
        ]
      }
    }),
    // Add the babel plugin for additional processing
    babel({
      babelConfig: {
        babelrc: false,
        configFile: false,
        plugins: [
    //      '@emotion/babel-plugin',
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          ['@babel/plugin-proposal-class-properties', { loose: true }]
        ]
      }
    })
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/setupTests.ts'],
    css: true,

    // Important for MUI to find React
    alias: {
      // 'react': '@preact/compat',
      // 'react-dom/test-utils': '@preact/compat/test-utils',
      // 'react-dom': '@preact/compat',
      // 'react/jsx-runtime': '@preact/compat/jsx-runtime',
       'react': 'preact/compat',
       'react-dom': 'preact/compat',
       'react-dom/test-utils': 'preact/test-utils',
       'react/jsx-runtime': 'preact/jsx-runtime',
      // These are specifically for Emotion compatibility
      '@emotion/styled': '@emotion/styled',
      '@emotion/react': '@emotion/react'
    },
    // Add this to handle ESM/CJS interop issues
    interopDefault: true,
    
    
    deps: {
       // Forces these modules to be bundled and processed 
      // instead of externalized
      inline: [
        '@emotion/react', 
        '@emotion/styled', 
        '@emotion/cache',
        '@mui/material', 
        '@mui/system',
        /preact/
      ],
      // This will force ESM imports for certain modules
      optimizer: {
        web: {
          enabled: true,
          include: ['@emotion', '@mui', 'preact']
        }
      }
    },
    // Ensure modules are resolved consistently
    conditions: ['module', 'browser', 'import', 'default'],
    // Add transformer options to support TypeScript decorators
    transformMode: {
      web: [/\.[jt]sx?$/]
    },
    // Use the test-specific TypeScript configuration
    typecheck: {
      tsconfig: './tsconfig.test.json'
    }
  },
  resolve: {
    alias: {
      // Standard React aliases
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react/jsx-runtime': 'preact/jsx-runtime',
      
      // Add specific aliases for React hooks and other APIs that Emotion might use
      'react/jsx-dev-runtime': 'preact/jsx-runtime',
      'react-is': 'preact/compat'
    }
  },
 
})