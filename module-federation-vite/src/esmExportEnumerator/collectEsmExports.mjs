/**
 * collectEsmExports.mjs
 *
 * Statically walks an ESM file (or TypeScript source file) and collects all
 * named exports, recursively following `export * from './relative'` re-exports.
 *
 * Uses:
 *  - acorn + acorn-walk  for .mjs / .js files
 *  - ts-morph            for .ts / .tsx files (follows export* chains via the TS compiler)
 *
 * CJS detection: if a file has no top-level `export` statements but does have
 * `module.exports` / `exports.` / `Object.defineProperty(exports` patterns,
 * it is flagged as CJS and the walk is aborted for that branch.
 *
 * Returns:
 *  {
 *    named: string[],        // sorted, deduplicated named export identifiers
 *    hasDefault: boolean,
 *    cjsBoundaries: string[] // files where the walk hit a CJS wall
 *  }
 */

import { parse as acornParse } from 'acorn';
import { simple as acornWalk } from 'acorn-walk';
import fs from 'node:fs';
import path from 'node:path';

// ─── CJS detection ───────────────────────────────────────────────────────────

const CJS_PATTERNS = [
  /\bmodule\.exports\s*=/,
  /\bexports\.\w+\s*=/,
  /Object\.defineProperty\s*\(\s*exports\s*,/,
  /\b__esModule\b/,
];

/** @param {string} src @returns {boolean} */
function isCjsSource(src) {
  // Quick pre-check: if it has any top-level export keyword it's ESM
  if (/^export\s/m.test(src)) return false;
  if (/^export\{/m.test(src)) return false;
  return CJS_PATTERNS.some((re) => re.test(src));
}

// ─── File resolution helpers ──────────────────────────────────────────────────

const ESM_EXTENSIONS = ['.mjs', '.js', '.ts', '.tsx', '.jsx'];

/** @param {string} absPath @returns {string|null} */
function resolveRelativeImport(absPath) {
  if (fs.existsSync(absPath)) return absPath;
  for (const ext of ESM_EXTENSIONS) {
    const candidate = absPath + ext;
    if (fs.existsSync(candidate)) return candidate;
  }
  // Try /index.{ext}
  for (const ext of ESM_EXTENSIONS) {
    const candidate = path.join(absPath, `index${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/** @param {string} fromFile @param {string} specifier @returns {string|null} */
function resolveRelativeSpecifier(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null; // bare specifier — don't follow
  const dir = path.dirname(fromFile);
  // Strip .js / .mjs extension aliases (TS files re-exported as .js)
  const stripped = specifier.replace(/\.(js|mjs|jsx)$/, '');
  return resolveRelativeImport(path.resolve(dir, stripped));
}

// ─── Acorn walker for .js / .mjs ─────────────────────────────────────────────

/**
 * @param {string} filePath
 * @param {Set<string>} visited
 * @param {Set<string>} named
 * @param {{ hasDefault: boolean, cjsBoundaries: string[] }} acc
 */
function walkJsFile(filePath, visited, named, acc) {
  if (visited.has(filePath)) return;
  visited.add(filePath);

  let src;
  try { src = fs.readFileSync(filePath, 'utf8'); } catch { return; }

  if (isCjsSource(src)) {
    acc.cjsBoundaries.push(filePath);
    return;
  }

  let ast;
  try {
    ast = acornParse(src, { ecmaVersion: 'latest', sourceType: 'module' });
  } catch {
    // Might be TS syntax — caller should have used ts-morph instead
    acc.cjsBoundaries.push(filePath);
    return;
  }

  acornWalk(ast, {
    ExportDefaultDeclaration() {
      acc.hasDefault = true;
    },
    ExportNamedDeclaration(node) {
      // export { foo, bar as baz }
      for (const spec of node.specifiers || []) {
        const exported = spec.exported?.name ?? spec.exported?.value;
        if (exported && exported !== 'default') named.add(exported);
        if (exported === 'default') acc.hasDefault = true;
      }
      // export const foo = ..., export function foo() {}
      if (node.declaration) {
        const decl = node.declaration;
        if (decl.id) {
          named.add(decl.id.name);
        } else if (decl.declarations) {
          for (const d of decl.declarations) {
            collectPatternBindings(d.id, named);
          }
        }
      }
      // export * from './relative'  — handled by ExportAllDeclaration
    },
    ExportAllDeclaration(node) {
      if (node.exported) {
        // export * as ns from '...' — namespace re-export, treat as a named export
        named.add(node.exported.name ?? node.exported.value);
        return;
      }
      const source = node.source?.value;
      if (!source) return;
      const resolved = resolveRelativeSpecifier(filePath, source);
      if (resolved) {
        walkJsFile(resolved, visited, named, acc);
      }
    },
  });
}

/** Collect all bound identifiers from destructuring patterns */
function collectPatternBindings(node, named) {
  if (!node) return;
  if (node.type === 'Identifier') { named.add(node.name); return; }
  if (node.type === 'ObjectPattern') {
    for (const prop of node.properties || []) {
      collectPatternBindings(prop.value || prop.argument, named);
    }
  }
  if (node.type === 'ArrayPattern') {
    for (const el of node.elements || []) {
      if (el) collectPatternBindings(el, named);
    }
  }
  if (node.type === 'RestElement') collectPatternBindings(node.argument, named);
  if (node.type === 'AssignmentPattern') collectPatternBindings(node.left, named);
}

// ─── ts-morph walker for .ts / .tsx ──────────────────────────────────────────

let _tsMorphProject = null;

/** Lazy-load ts-morph to avoid startup cost when not needed */
async function getTsMorphProject() {
  if (_tsMorphProject) return _tsMorphProject;
  const { Project } = await import('ts-morph');
  _tsMorphProject = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      allowJs: true,
      skipLibCheck: true,
      moduleResolution: 100, // Bundler
    },
  });
  return _tsMorphProject;
}

/**
 * Use ts-morph to extract all named exports from a TS/TSX file, following
 * export* chains (ts-morph resolves them via the compiler).
 *
 * @param {string} filePath
 * @returns {Promise<{ named: string[], hasDefault: boolean, cjsBoundaries: string[] }>}
 */
async function collectTsExports(filePath) {
  const project = await getTsMorphProject();

  // Add file if not already in project
  let sourceFile = project.getSourceFile(filePath);
  if (!sourceFile) {
    try {
      sourceFile = project.addSourceFileAtPath(filePath);
    } catch {
      return { named: [], hasDefault: false, cjsBoundaries: [filePath] };
    }
  }

  const named = new Set();
  let hasDefault = false;
  const cjsBoundaries = [];

  // getExportedDeclarations() follows export* chains and returns all symbols.
  // We filter to value-space declarations only — types and interfaces don't
  // exist at runtime so should not appear in namedExports.
  const TYPE_ONLY_KINDS = new Set([
    'TypeAliasDeclaration',   // type Foo = ...
    'InterfaceDeclaration',   // interface Foo {}
    'TypeParameter',
  ]);

  try {
    const exportedDecls = sourceFile.getExportedDeclarations();
    for (const [exportName, decls] of exportedDecls) {
      // Skip if ALL declarations for this name are type-only
      const hasValueDecl = decls.some((d) => !TYPE_ONLY_KINDS.has(d.getKindName()));
      if (!hasValueDecl) continue;

      if (exportName === 'default') {
        hasDefault = true;
      } else {
        named.add(exportName);
      }
    }
  } catch {
    cjsBoundaries.push(filePath);
  }

  return {
    named: [...named].sort(),
    hasDefault,
    cjsBoundaries,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Collect all named exports from an entry file by static AST analysis.
 *
 * @param {string} absoluteEntryPath  resolved absolute path to the entry file
 * @returns {Promise<{
 *   named: string[],
 *   hasDefault: boolean,
 *   cjsBoundaries: string[],
 *   strategy: 'ts-morph' | 'acorn' | 'cjs-detected'
 * }>}
 */
export async function collectEsmExports(absoluteEntryPath) {
  const ext = path.extname(absoluteEntryPath).toLowerCase();

  // TypeScript source → ts-morph (most accurate, follows export* via compiler)
  if (ext === '.ts' || ext === '.tsx') {
    const result = await collectTsExports(absoluteEntryPath);
    return { ...result, strategy: result.cjsBoundaries.length ? 'cjs-detected' : 'ts-morph' };
  }

  // JS/MJS → acorn
  const src = fs.existsSync(absoluteEntryPath)
    ? fs.readFileSync(absoluteEntryPath, 'utf8')
    : null;

  if (!src) {
    return { named: [], hasDefault: false, cjsBoundaries: [absoluteEntryPath], strategy: 'cjs-detected' };
  }

  if (isCjsSource(src)) {
    return { named: [], hasDefault: false, cjsBoundaries: [absoluteEntryPath], strategy: 'cjs-detected' };
  }

  const named = new Set();
  const acc = { hasDefault: false, cjsBoundaries: [] };
  walkJsFile(absoluteEntryPath, new Set(), named, acc);

  return {
    named: [...named].sort(),
    hasDefault: acc.hasDefault,
    cjsBoundaries: acc.cjsBoundaries,
    strategy: acc.cjsBoundaries.length ? 'cjs-detected' : 'acorn',
  };
}
