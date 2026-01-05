// import React from 'react'
import { expect, vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
// Make sure to extend Vitest's expect correctly for your version
// For vitest v3+:
expect.extend(matchers);
// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});
// Mock for ResizeObserver (used by MUI components)
global.ResizeObserver = class ResizeObserver {
    constructor(_callback) { }
    observe() { }
    unobserve() { }
    disconnect() { }
};
// Mock for window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
// Fix for MUI portal rendering in tests
Object.defineProperty(window, 'scrollTo', { value: () => { }, writable: true });
// Mock the MUI theming system
vi.mock('@mui/private-theming/esm/useTheme/useTheme', () => {
    return {
        default: () => ({
            palette: {
                primary: { main: '#1976d2' },
                secondary: { main: '#dc004e' }
            },
            spacing: (factor) => `${factor * 8}px`,
            typography: {
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
            }
        })
    };
});
// Alternative approach - mock the entire styles module
vi.mock('@mui/material/styles', async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        useTheme: () => ({
            palette: {
                primary: { main: '#1976d2' },
                secondary: { main: '#dc004e' }
            },
            spacing: (factor) => `${factor * 8}px`,
            typography: {
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
            }
        }),
        ThemeProvider: ({ children }) => children
    };
});
//# sourceMappingURL=setupTests.js.map