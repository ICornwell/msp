#!/usr/bin/env node
/**
 * index.mjs  —  ESM Export Enumerator CLI
 *
 * Usage:
 *   node src/esmExportEnumerator/index.mjs [options] [specifier...]
 *
 * Options:
 *   --write           Write updated namedExports back to registry.manifest.json
 *   --verbose         Show unchanged packages too
 *   --check           Exit with code 1 if any package has additions or removals (CI mode)
 *   --dry-run         Like --write but only print the updated manifest, don't save
 *
 * If no specifiers are given, reads the full list from msp_svr_common/src/sharedDeps.ts
 * by extracting keys from the sharedVersions object (simple regex, no TS compilation needed).
 *
 * Examples:
 *   node src/esmExportEnumerator/index.mjs
 *   node src/esmExportEnumerator/index.mjs react @azure/msal-browser
 *   node src/esmExportEnumerator/index.mjs --write
 *   node src/esmExportEnumerator/index.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { applyDiffToManifest, diffManifest, formatDiff } from './diffManifest.mjs';
import { enumeratePackageExports } from './enumeratePackageExports.mjs';
import { discoverWorkspacePackages } from './resolvePackageEntry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
const monorepoRoot = path.resolve(projectRoot, '..');
const manifestPath = path.resolve(projectRoot, 'src/virtualModules/sharedEsmExports/registry.manifest.json');
const sharedDepsPath = path.resolve(monorepoRoot, 'msp_svr_common/src/sharedDeps.ts');

// ─── CLI argument parsing ─────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const specifierArgs = args.filter((a) => !a.startsWith('--'));

const doWrite = flags.has('--write');
const doDryRun = flags.has('--dry-run');
const verbose = flags.has('--verbose');
const checkMode = flags.has('--check');

// ─── Workspace packages discovery ────────────────────────────────────────────

const workspaceFolders = fs
  .readdirSync(monorepoRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'node_modules')
  .map((d) => path.join(monorepoRoot, d.name));

const workspacePackages = discoverWorkspacePackages(workspaceFolders);
console.log(`Workspace packages found: ${Object.keys(workspacePackages).join(', ')}`);

// ─── Specifier list ───────────────────────────────────────────────────────────

/**
 * Extract specifier keys from sharedDeps.ts using a simple regex.
 * If the file can't be read, returns an empty array.
 * @returns {string[]}
 */
function readSharedDepsSpecifiers() {
  if (!fs.existsSync(sharedDepsPath)) {
    console.warn(`Warning: sharedDeps.ts not found at ${sharedDepsPath}`);
    return [];
  }
  const src = fs.readFileSync(sharedDepsPath, 'utf8');
  const matches = [...src.matchAll(/'([^']+)':\s*\{version:/g)];
  return matches.map((m) => m[1]);
}

const specifiers = specifierArgs.length > 0 ? specifierArgs : readSharedDepsSpecifiers();

if (specifiers.length === 0) {
  console.error('No specifiers to process. Pass specifiers as arguments or ensure msp_svr_common/src/sharedDeps.ts is present.');
  process.exit(1);
}

console.log(`\nEnumerating ${specifiers.length} packages...\n`);

// ─── Load manifest ────────────────────────────────────────────────────────────

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

/** @type {Map<string, object>} */
const manifestByPackage = new Map(manifest.packages.map((e) => [e.package, e]));

// ─── Run enumeration ──────────────────────────────────────────────────────────

let updatedEntries = [...manifest.packages];
let hadChanges = false;

for (const specifier of specifiers) {
  process.stdout.write(`  ${specifier} ... `);

  const result = await enumeratePackageExports(specifier, monorepoRoot, workspacePackages);

  if (result.strategy === 'unresolved') {
    process.stdout.write(`\x1b[31mUNRESOLVED\x1b[0m\n`);
    if (result.warning) console.log(`    ${result.warning}`);
    continue;
  }

  process.stdout.write(`${result.strategy} (${result.named.length} exports)\n`);
  if (result.warning) console.log(`    \x1b[33mwarn:\x1b[0m ${result.warning}`);

  const diff = diffManifest(specifier, result.named, manifestByPackage.get(specifier));

  const line = formatDiff(diff, { verbose });
  if (line) console.log(line);

  if (diff.status === 'updated' || diff.status === 'new') {
    hadChanges = true;
    if (doWrite || doDryRun) {
      updatedEntries = applyDiffToManifest(updatedEntries, diff);
    }
  }
}

console.log('');

// ─── Write / dry-run ──────────────────────────────────────────────────────────

if ((doWrite || doDryRun) && hadChanges) {
  const updatedManifest = { ...manifest, packages: updatedEntries };
  const output = JSON.stringify(updatedManifest, null, 2) + '\n';

  if (doDryRun) {
    console.log('--- Dry-run: updated manifest ---');
    console.log(output);
  } else {
    fs.writeFileSync(manifestPath, output, 'utf8');
    console.log(`\x1b[32mWritten:\x1b[0m ${path.relative(monorepoRoot, manifestPath)}`);
    console.log(`Run 'yarn workspace @module-federation/vite run generate:shared-esm-registry' to rebuild index.ts`);
  }
}

if (!hadChanges) {
  console.log('\x1b[32mAll packages match the manifest. No changes needed.\x1b[0m');
}

// ─── CI check ─────────────────────────────────────────────────────────────────

if (checkMode && hadChanges) {
  console.error('\x1b[31mManifest is out of date. Run without --check to see details.\x1b[0m');
  process.exit(1);
}
