import { describe, expect, it } from 'vitest';
import {
  getDirectServeExportCode,
  shouldForceEsmInServe,
} from './index';

describe('sharedEsmExports direct serve wrappers', () => {
  it('marks react runtime packages as force-ESM in serve mode', () => {
    expect(shouldForceEsmInServe('react')).toBe(true);
    expect(shouldForceEsmInServe('react-dom/client')).toBe(true);
    expect(shouldForceEsmInServe('react/jsx-dev-runtime')).toBe(true);
    expect(shouldForceEsmInServe('@mui/material')).toBe(false);
  });

  it('emits explicit named exports for react/jsx-dev-runtime', () => {
    const code = getDirectServeExportCode('react/jsx-dev-runtime');

    expect(code).toContain('import * as sharedModule from "react/jsx-dev-runtime";');
    expect(code).toContain('export const jsxDEV = sharedModule.jsxDEV;');
    expect(code).toContain('export const Fragment = sharedModule.Fragment;');
    expect(code).not.toContain('export * from');
  });

  it('emits explicit named exports for react-dom/client', () => {
    const code = getDirectServeExportCode('react-dom/client');

    expect(code).toContain('import * as sharedModule from "react-dom/client";');
    expect(code).toContain('export const createRoot = sharedModule.createRoot;');
    expect(code).toContain('export const hydrateRoot = sharedModule.hydrateRoot;');
    expect(code).not.toContain('export * from');
  });
});
