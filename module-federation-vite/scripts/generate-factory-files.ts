#!/usr/bin/env node
/**
 * generate-factory-files.ts
 *
 * Generates / regenerates the factory .ts files under src/virtualModules/sharedEsmExports/
 * from the gen metadata attached to each entry in msp_common/src/sharedDeps.ts.
 *
 * Run via:
 *   tsx ./scripts/generate-factory-files.ts [options] [specifier...]
 *
 * Options:
 *   --dry-run    Print what would be written, don't touch the filesystem
 *   --verbose    Show details for every package, including unchanged ones
 *   --no-manifest  Skip updating registry.manifest.json (only write .ts files)
 *
 * Export list sources (controlled by gen.mode in sharedDeps.ts):
 *   list     — reads namedExports from registry.manifest.json (or gen.exports if provided)
 *   scan     — enumerates via the esmExportEnumerator AST tools
 *   imports  — scans the monorepo source for import { ... } from 'pkg' usages
 *   default-only — emits a simple defaultExportCode() delegate (no named exports)
 *
 * After running, re-generate index.ts with:
 *   yarn workspace @module-federation/vite run generate:shared-esm-registry
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Direct TypeScript import — tsx handles the .ts extension
import { sharedVersions, type FactoryGenMeta } from '../../msp_common/src/sharedDeps.ts';

// Enumerator for 'scan' mode (already in devDeps: acorn, acorn-walk, ts-morph)
import { enumeratePackageExports } from '../src/esmExportEnumerator/enumeratePackageExports.mjs';
import { discoverWorkspacePackages } from '../src/esmExportEnumerator/resolvePackageEntry.mjs';

// ─── Paths ────────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(projectRoot, '..');
const sharedEsmDir = path.resolve(projectRoot, 'src/virtualModules/sharedEsmExports');
const manifestPath = path.resolve(sharedEsmDir, 'registry.manifest.json');

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const filterPkgs = args.filter((a) => !a.startsWith('--'));

const dryRun = flags.has('--dry-run');
const verbose = flags.has('--verbose');
const noManifest = flags.has('--no-manifest');

// ─── Manifest types ───────────────────────────────────────────────────────────

interface PackageEntry {
  package: string;
  module: string;
  factory: string;
  namedExports?: string[];
}

interface Manifest {
  defaultExport: { module: string; factory: string };
  packages: PackageEntry[];
}

function readManifest(): Manifest {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function writeManifest(manifest: Manifest): void {
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

// ─── Name derivation (only used for packages not yet in the manifest) ─────────

/**
 * '@emotion/react/jsx-runtime' → 'emotionReactJsxRuntime'
 * '@azure/msal-browser'        → 'azureMsalBrowser'  (existing files use manifest path)
 * 'msp_ui_common/uiLib'        → 'mspUiCommonUiLib'
 */
function deriveModuleName(pkg: string): string {
  return pkg
    .replace(/^@/, '')
    .split(/[\/\-_]/)
    .filter(Boolean)
    .map((s, i) => (i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1)))
    .join('');
}

function deriveModulePath(pkg: string): string {
  return './' + deriveModuleName(pkg);
}

function deriveFactoryName(pkg: string): string {
  return deriveModuleName(pkg) + 'ExportCode';
}

// ─── Factory code builders ────────────────────────────────────────────────────

function buildDefaultChain(depth: 1 | 3): string {
  // Deepest unwrap first: moduleFactory?.default?.default?.default ?? ... ?? moduleFactory
  const parts: string[] = [];
  for (let d = depth; d >= 0; d--) {
    parts.push('moduleFactory' + '?.default'.repeat(d));
  }
  return parts.join(' ?? ');
}

function buildPickBlock(namedExports: string[], sentinel: string, depth: 1 | 3): string {
  const defaultChain = buildDefaultChain(depth);

  // fallbackCandidates lines
  const fbLines: string[] = [];
  for (let d = 0; d <= depth; d++) {
    fbLines.push('      fallbackModule' + '?.default'.repeat(d) + ',');
  }

  // candidates lines
  const cLines: string[] = [];
  for (let d = 0; d <= depth; d++) {
    cLines.push('      moduleFactory' + '?.default'.repeat(d) + ',');
  }

  // named export lines
  const namedLines = namedExports.map((x) => `    export const ${x} = pick('${x}');`);

  return [
    `    const fallbackCandidates = typeof fallbackModule !== 'undefined' ? [`,
    ...fbLines,
    `    ] : [];`,
    ``,
    `    const candidates = [`,
    ...cLines,
    `      ...fallbackCandidates,`,
    `    ];`,
    ``,
    `    const pick = (key) => {`,
    `      for (const candidate of candidates) {`,
    `        if (candidate && candidate[key] !== undefined) {`,
    `          return candidate[key];`,
    `        }`,
    `      }`,
    `      return undefined;`,
    `    };`,
    ``,
    `    const sharedModule = pick('${sentinel}')`,
    `      ? candidates.find((c) => c && c.${sentinel})`,
    `      : (${defaultChain});`,
    `    export default sharedModule;`,
    ...namedLines,
  ].join('\n');
}

function buildFactoryFileContent(
  factoryName: string,
  gen: FactoryGenMeta,
  namedExports: string[],
): string {
  const header = '// Generated by scripts/generate-factory-files.ts — edit sharedDeps.ts gen config to update';

  if (gen.mode === 'default-only') {
    return [
      header,
      `import { defaultExportCode } from './defaultExport';`,
      ``,
      `export function ${factoryName}(): string {`,
      `  return defaultExportCode();`,
      `}`,
      ``,
    ].join('\n');
  }

  const depth: 1 | 3 = (gen as { defaultDepth?: 1 | 3 }).defaultDepth ?? 1;
  const sentinel = (gen as { sentinel?: string }).sentinel ?? namedExports[0] ?? '__module';
  const body = buildPickBlock(namedExports, sentinel, depth);

  return [
    header,
    `export function ${factoryName}(): string {`,
    `  return \``,
    body,
    `  \`;`,
    `}`,
    ``,
  ].join('\n');
}

// ─── Import scanner (mode: 'imports') ────────────────────────────────────────

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractNamedImports(src: string, specifier: string, found: Set<string>): void {
  // Match: import { ... } from 'pkg' — but NOT import type { ... }
  // Also skip inline `type` qualifiers inside the braces
  const re = new RegExp(
    `import\\s+(?!type[\\s,{])\\{([^}]*)\\}\\s*from\\s*['"]${escapeRegex(specifier)}['"]`,
    'gs',
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    for (const token of m[1].split(',')) {
      const clean = token.replace(/\s+/g, ' ').trim();
      if (!clean) continue;
      const parts = clean.split(/\s+/);
      if (parts[0] === 'type') continue; // inline type qualifier
      const name = parts[0];
      if (name && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
        found.add(name);
      }
    }
  }
}

const SKIP_DIRS = new Set([
  'node_modules', 'dist', 'distApi', 'distUiLib', 'distLib',
  'build', '__mf__virtual', '.git', '.vscode', 'coverage',
]);

function* walkTs(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walkTs(full);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      yield full;
    }
  }
}

function scanRepoImports(specifier: string): string[] {
  const found = new Set<string>();
  let fileCount = 0;

  const scanDirs = fs
    .readdirSync(monorepoRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'node_modules')
    .map((d) => path.join(monorepoRoot, d.name))
    .filter((d) => d !== projectRoot); // exclude module-federation-vite itself

  for (const dir of scanDirs) {
    const srcDir = path.join(dir, 'src');
    if (!fs.existsSync(srcDir)) continue;
    for (const file of walkTs(srcDir)) {
      extractNamedImports(fs.readFileSync(file, 'utf8'), specifier, found);
      fileCount++;
    }
  }

  if (verbose) console.log(`    scanned ${fileCount} source files`);
  return [...found].sort();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const manifest = readManifest();
  const manifestByPkg = new Map(manifest.packages.map((p) => [p.package, p] as const));

  // Workspace packages needed for scan mode
  const workspaceFolders = fs
    .readdirSync(monorepoRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'node_modules')
    .map((d) => path.join(monorepoRoot, d.name));
  const nodeModulesRoot = path.join(monorepoRoot, 'node_modules');
  // Lazy-init workspace packages only if scan mode is used
  let _workspacePackages: ReturnType<typeof discoverWorkspacePackages> | null = null;
  const getWorkspacePackages = () => {
    if (!_workspacePackages) _workspacePackages = discoverWorkspacePackages(workspaceFolders);
    return _workspacePackages;
  };

  const packages = Object.entries(sharedVersions).filter(
    ([pkg, info]) => info.gen != null && (filterPkgs.length === 0 || filterPkgs.includes(pkg)),
  );

  if (packages.length === 0) {
    console.log('No packages with gen metadata found (or none matched the filter).');
    return;
  }

  console.log(`Generating factory files for ${packages.length} package(s)...\n`);

  // Track written module paths to avoid double-writing shared factory files
  const writtenPaths = new Set<string>();
  let manifestChanged = false;

  for (const [specifier, info] of packages) {
    const gen = info.gen!;

    // Resolve module path + factory name: use existing manifest entry to preserve
    // hand-chosen names (e.g. msalBrowser not azureMsalBrowser), derive for new packages.
    const existing = manifestByPkg.get(specifier);
    const modulePath = existing?.module ?? deriveModulePath(specifier);
    const factoryName = existing?.factory ?? deriveFactoryName(specifier);
    const factoryFilePath = path.join(sharedEsmDir, modulePath.replace('./', '') + '.ts');

    // ── Collect named exports ────────────────────────────────────────────────
    let namedExports: string[] = [];

    if (gen.mode === 'default-only') {
      // nothing to collect
    } else if (gen.mode === 'list') {
      const inlineExports = (gen as { exports?: string[] }).exports;
      namedExports = inlineExports ?? existing?.namedExports ?? [];
      if (namedExports.length === 0) {
        console.warn(`  [WARN] ${specifier}: mode=list but no exports found in gen.exports or manifest namedExports`);
      }
    } else if (gen.mode === 'scan') {
      process.stdout.write(`  ${specifier} ... scanning package`);
      const result = await enumeratePackageExports(specifier, nodeModulesRoot, getWorkspacePackages());
      namedExports = result.named;
      if (result.warning) process.stdout.write(` (${result.warning})`);
      console.log(` → ${namedExports.length} exports`);
    } else if (gen.mode === 'imports') {
      process.stdout.write(`  ${specifier} ... scanning repo imports`);
      namedExports = scanRepoImports(specifier);
      console.log(` → ${namedExports.length} imports found`);
    }

    // ── Generate factory file ────────────────────────────────────────────────
    const content = buildFactoryFileContent(factoryName, gen, namedExports);

    if (writtenPaths.has(factoryFilePath)) {
      if (verbose) console.log(`  ${specifier}: skipped (${path.basename(factoryFilePath)} shared with earlier package)`);
    } else {
      writtenPaths.add(factoryFilePath);
      const rel = path.relative(projectRoot, factoryFilePath);
      if (dryRun) {
        console.log(`\n[DRY RUN] ${rel}:\n${content}`);
      } else {
        fs.writeFileSync(factoryFilePath, content);
        if (verbose || gen.mode !== 'list') console.log(`  written: ${rel}`);
      }
    }

    // ── Update manifest entry ────────────────────────────────────────────────
    if (!noManifest) {
      const newEntry: PackageEntry = {
        package: specifier,
        module: modulePath,
        factory: factoryName,
        ...(gen.mode !== 'default-only' && namedExports.length > 0 ? { namedExports } : {}),
      };

      if (existing) {
        const idx = manifest.packages.findIndex((p) => p.package === specifier);
        manifest.packages[idx] = { ...existing, ...newEntry };
      } else {
        manifest.packages.push(newEntry);
        console.log(`  [NEW] added ${specifier} to manifest`);
      }
      manifestChanged = true;
    }
  }

  // ── Persist manifest ─────────────────────────────────────────────────────
  if (manifestChanged && !noManifest) {
    if (dryRun) {
      console.log('\n[DRY RUN] Would update registry.manifest.json');
    } else {
      writeManifest(manifest);
      console.log('\nUpdated registry.manifest.json');
      console.log('Next: yarn workspace @module-federation/vite run generate:shared-esm-registry');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
