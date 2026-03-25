/**
 * enumeratePackageExports.mjs
 *
 * Top-level orchestrator: given a package specifier, resolves its entry point,
 * tries static AST analysis, and falls back to dynamic import() if CJS is hit.
 *
 * Returns a consistent result shape regardless of which path succeeded.
 */

import fs from 'node:fs';
import path from 'node:path';
import { collectEsmExports } from './collectEsmExports.mjs';
import { resolvePackageEntry } from './resolvePackageEntry.mjs';

/**
 * @typedef {{
 *   specifier: string,
 *   named: string[],
 *   hasDefault: boolean,
 *   strategy: 'ts-morph' | 'acorn' | 'dynamic-import' | 'cjs-no-fallback' | 'unresolved',
 *   cjsBoundaries: string[],
 *   entryPath: string | null,
 *   warning: string | null,
 * }} EnumerationResult
 */

/**
 * Attempt dynamic import() and enumerate Object.keys of the module.
 * @param {string} specifier  bare specifier or absolute file:// path
 * @returns {Promise<{ named: string[], hasDefault: boolean, error: string|null }>}
 */
async function dynamicImportFallback(specifier) {
  try {
    const mod = await import(specifier);
    const named = Object.keys(mod)
      .filter((k) => k !== 'default' && !k.startsWith('__'))
      .sort();
    const hasDefault = 'default' in mod;
    return { named, hasDefault, error: null };
  } catch (e) {
    return { named: [], hasDefault: false, error: e.message };
  }
}

/**
 * For workspace packages whose exports field points at .ts source, find the
 * corresponding built .js file by looking for a sibling distUiLib/ or dist/
 * directory that mirrors the source structure.
 * @param {string} absoluteTsPath  absolute path to the .ts source entry
 * @param {string} packageRoot
 * @param {object} packageJson
 * @returns {string|null}  absolute path to the built .js counterpart, or null
 */
function findBuiltEquivalent(absoluteTsPath, packageRoot, packageJson) {
  // Find which source root the file lives under
  // Common patterns: src/uiLib/... → distUiLib/..., src/... → dist/...
  const relToPackage = path.relative(packageRoot, absoluteTsPath);

  // Try resolving via the types field of the matching exports entry
  if (packageJson.exports) {
    for (const [, value] of Object.entries(packageJson.exports)) {
      const typesPath = typeof value === 'object' ? value?.types : null;
      if (!typesPath) continue;
      const absTypes = path.resolve(packageRoot, typesPath);
      // Strip .d.ts → .js
      const absJs = absTypes.replace(/\.d\.ts$/, '.js');
      if (fs.existsSync(absJs)) {
        // Check it's for the right sub-path by comparing directory names
        const tsDir = path.dirname(absoluteTsPath).split(path.sep).pop();
        const jsDir = path.dirname(absJs).split(path.sep).pop();
        if (tsDir === jsDir || tsDir === 'uiLib' || jsDir === 'distUiLib') {
          return absJs;
        }
      }
    }
  }

  // Fallback: replace /src/ with /dist/ or /distUiLib/
  for (const [srcDir, distDir] of [['src/uiLib', 'distUiLib'], ['src', 'dist']]) {
    if (relToPackage.startsWith(srcDir + '/') || relToPackage.startsWith(srcDir + path.sep)) {
      const rel = relToPackage.slice(srcDir.length + 1).replace(/\.(ts|tsx)$/, '.js');
      const candidate = path.join(packageRoot, distDir, rel);
      if (fs.existsSync(candidate)) return candidate;
    }
  }

  return null;
}

/**
 * Enumerate all named exports for a package specifier.
 *
 * @param {string} specifier  e.g. 'react', 'msp_ui_common/uiLib/components'
 * @param {string} nodeModulesRoot  absolute path to the monorepo root containing node_modules/
 * @param {Record<string, string>} [workspacePackages]  name → package root for workspace packages
 * @returns {Promise<EnumerationResult>}
 */
export async function enumeratePackageExports(specifier, nodeModulesRoot, workspacePackages = {}) {
  const entry = resolvePackageEntry(specifier, nodeModulesRoot, workspacePackages);

  if (!entry) {
    return {
      specifier,
      named: [],
      hasDefault: false,
      strategy: 'unresolved',
      cjsBoundaries: [],
      entryPath: null,
      warning: `Could not resolve package entry for: ${specifier}`,
    };
  }

  const { absolutePath, isWorkspace } = entry;

  // For workspace packages whose exports field points at TypeScript source files,
  // ts-morph may not capture everything that the built output exports (e.g. items
  // re-exported only in the compiled dist but not the source index).
  // Prefer dynamic import() of the built dist — it's the ground truth of what
  // MF will actually load at runtime.
  if (isWorkspace) {
    const isTsEntry = absolutePath.endsWith('.ts') || absolutePath.endsWith('.tsx');
    const importTarget = isTsEntry
      ? (findBuiltEquivalent(absolutePath, entry.packageRoot, entry.packageJson) ?? absolutePath)
      : absolutePath;

    const dynResult = await dynamicImportFallback(
      importTarget.startsWith('/') ? `file://${importTarget}` : importTarget
    );
    if (!dynResult.error && dynResult.named.length > 0) {
      return {
        specifier,
        named: dynResult.named,
        hasDefault: dynResult.hasDefault,
        strategy: 'dynamic-import',
        cjsBoundaries: [],
        entryPath: importTarget,
        warning: isTsEntry && importTarget !== absolutePath
          ? null
          : isTsEntry
            ? `No built equivalent found, used ts-morph fallback`
            : null,
      };
    }
    // Fall through to static analysis if import() didn't work
  }

  // Try static analysis (for npm packages)
  const staticResult = await collectEsmExports(absolutePath);

  // If static analysis succeeded cleanly (no CJS boundaries hit, exports found),
  // or if the file is TS source (ts-morph is authoritative), trust it.
  const isTsSource = absolutePath.endsWith('.ts') || absolutePath.endsWith('.tsx');
  const staticSucceeded =
    staticResult.strategy !== 'cjs-detected' &&
    (staticResult.named.length > 0 || staticResult.hasDefault || isTsSource);

  if (staticSucceeded) {
    return {
      specifier,
      named: staticResult.named,
      hasDefault: staticResult.hasDefault,
      strategy: staticResult.strategy,
      cjsBoundaries: staticResult.cjsBoundaries,
      entryPath: absolutePath,
      warning: staticResult.cjsBoundaries.length
        ? `Partial CJS wall hit in: ${staticResult.cjsBoundaries.map(p => p.split('node_modules/').pop()).join(', ')}`
        : null,
    };
  }

  // CJS hit or zero exports from a non-empty file → try dynamic import()
  const dynResult = await dynamicImportFallback(specifier);

  if (dynResult.error) {
    // Dynamic import also failed (e.g. browser-only APIs, not runnable in Node)
    return {
      specifier,
      named: staticResult.named, // might be empty, but carry whatever static found
      hasDefault: staticResult.hasDefault,
      strategy: 'cjs-no-fallback',
      cjsBoundaries: staticResult.cjsBoundaries,
      entryPath: absolutePath,
      warning: `CJS entry, dynamic import also failed: ${dynResult.error}`,
    };
  }

  return {
    specifier,
    named: dynResult.named,
    hasDefault: dynResult.hasDefault,
    strategy: 'dynamic-import',
    cjsBoundaries: staticResult.cjsBoundaries,
    entryPath: absolutePath,
    warning: staticResult.cjsBoundaries.length
      ? `CJS entry detected, fell back to dynamic import`
      : null,
  };
}
