/**
 * resolvePackageEntry.mjs
 *
 * Resolves the absolute path to the best ESM entry file for a package specifier.
 *
 * Strategy (in priority order):
 *  1. exports[subpath]['import'] or exports[subpath] if it's a string
 *  2. "module" field (top-level for the root package)
 *  3. "main" field as last resort
 *
 * For workspace packages (no node_modules entry), the package's own "exports"
 * map is used with the specifier's sub-path resolved against the package root.
 *
 * Returns { absolutePath, packageRoot, packageJson, isWorkspace }
 * Returns null if the package cannot be located.
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

/**
 * Walk the package exports condition tree to find an 'import' (ESM) path.
 * @param {unknown} node
 * @returns {string|null}
 */
function pickImportCondition(node) {
  if (typeof node === 'string') return node;
  if (node && typeof node === 'object') {
    // Prefer explicit 'import' > 'module' > 'browser' > 'default'
    for (const key of ['import', 'module', 'browser', 'default']) {
      if (key in node) {
        const result = pickImportCondition(node[key]);
        if (result) return result;
      }
    }
    // Check remaining string values
    for (const val of Object.values(node)) {
      if (typeof val === 'string') return val;
    }
  }
  return null;
}

/**
 * Resolve the exports field for a given sub-path key (e.g. '.' or './uiLib').
 * @param {Record<string, unknown>} exports
 * @param {string} subPathKey  e.g. '.' or './uiLib/components'
 * @returns {string|null}
 */
function resolveExportsField(exports, subPathKey) {
  if (!exports || typeof exports !== 'object') return null;

  // Direct key match
  if (subPathKey in exports) {
    return pickImportCondition(exports[subPathKey]);
  }

  // Pattern matching (e.g. "./*" → "./*.js")
  for (const [pattern, value] of Object.entries(exports)) {
    if (!pattern.includes('*')) continue;
    const [prefix, suffix] = pattern.split('*');
    if (subPathKey.startsWith(prefix) && (suffix === '' || subPathKey.endsWith(suffix))) {
      const wildcard = subPathKey.slice(prefix.length, suffix ? -suffix.length : undefined);
      const resolved = pickImportCondition(value);
      if (resolved) return resolved.replace('*', wildcard);
    }
  }

  return null;
}

/**
 * Given a package specifier (potentially with sub-path), find the package.json
 * and resolve the entry file path.
 *
 * @param {string} specifier  e.g. 'react', '@azure/msal-browser', 'msp_ui_common/uiLib'
 * @param {string} nodeModulesRoot  absolute path to the directory containing node_modules
 * @param {Record<string, string>} [workspacePackages]  name → absolute package root for workspace pkgs
 * @returns {{ absolutePath: string, packageRoot: string, packageJson: object, isWorkspace: boolean } | null}
 */
export function resolvePackageEntry(specifier, nodeModulesRoot, workspacePackages = {}) {
  // Split into package name + sub-path
  // Handles: 'react', '@azure/msal-browser', 'msp_ui_common/uiLib/components'
  let packageName, subPath;
  if (specifier.startsWith('@')) {
    const parts = specifier.split('/');
    packageName = parts.slice(0, 2).join('/');
    subPath = parts.slice(2).join('/');
  } else {
    const slashIdx = specifier.indexOf('/');
    if (slashIdx === -1) {
      packageName = specifier;
      subPath = '';
    } else {
      packageName = specifier.slice(0, slashIdx);
      subPath = specifier.slice(slashIdx + 1);
    }
  }

  const subPathKey = subPath ? `./${subPath}` : '.';

  // Locate package root
  let packageRoot = null;
  let isWorkspace = false;

  if (workspacePackages[packageName]) {
    packageRoot = workspacePackages[packageName];
    isWorkspace = true;
  } else {
    const candidate = path.join(nodeModulesRoot, 'node_modules', packageName);
    if (fs.existsSync(candidate)) {
      packageRoot = candidate;
    }
  }

  if (!packageRoot) return null;

  const pkgJsonPath = path.join(packageRoot, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) return null;

  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  } catch {
    return null;
  }

  let relEntryPath = null;

  // 1. Try exports field
  if (packageJson.exports) {
    relEntryPath = resolveExportsField(packageJson.exports, subPathKey);
  }

  // 2. For root entry, fall back to "module" then "main"
  if (!relEntryPath && subPathKey === '.') {
    relEntryPath = packageJson.module || packageJson.main || null;
  }

  // 3. For workspace with source-pointing exports that use .ts paths, trust them directly
  if (!relEntryPath) return null;

  const absolutePath = path.resolve(packageRoot, relEntryPath);
  if (!fs.existsSync(absolutePath)) {
    // Try common extensions
    for (const ext of ['.ts', '.tsx', '.mjs', '.js', '.cjs']) {
      const candidate = absolutePath + ext;
      if (fs.existsSync(candidate)) return { absolutePath: candidate, packageRoot, packageJson, isWorkspace };
    }
    return null;
  }

  return { absolutePath, packageRoot, packageJson, isWorkspace };
}

/**
 * Scan a workspace for all package.json files to build a name → root map.
 * Walks one level of directories from the given roots.
 * @param {string[]} workspaceFolders  absolute paths to workspace folder roots
 * @returns {Record<string, string>}
 */
export function discoverWorkspacePackages(workspaceFolders) {
  /** @type {Record<string, string>} */
  const map = {};
  for (const folder of workspaceFolders) {
    const pkgJson = path.join(folder, 'package.json');
    if (fs.existsSync(pkgJson)) {
      try {
        const { name } = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
        if (name) map[name] = folder;
      } catch { /* skip */ }
    }
  }
  return map;
}
