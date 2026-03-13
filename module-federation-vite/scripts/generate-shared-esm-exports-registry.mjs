import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const sharedEsmDir = path.resolve(projectRoot, 'src/virtualModules/sharedEsmExports');
const manifestPath = path.resolve(sharedEsmDir, 'registry.manifest.json');
const outputPath = path.resolve(sharedEsmDir, 'index.ts');

/** @typedef {{ module: string, factory: string }} DefaultExportConfig */
/** @typedef {{ package: string, module: string, factory: string, forceEsmInServe: boolean, namedExports?: string[] }} PackageConfig */
/** @typedef {{ defaultExport: DefaultExportConfig, packages: PackageConfig[] }} Manifest */

/** @returns {Manifest} */
function readManifest() {
  const raw = fs.readFileSync(manifestPath, 'utf8');
  return JSON.parse(raw);
}

/** @param {Manifest} manifest */
function validateManifest(manifest) {
  if (!manifest.defaultExport?.module || !manifest.defaultExport?.factory) {
    throw new Error('registry.manifest.json must define defaultExport.module and defaultExport.factory');
  }
  if (!Array.isArray(manifest.packages)) {
    throw new Error('registry.manifest.json must define packages as an array');
  }

  const seenPackages = new Set();
  for (const entry of manifest.packages) {
    if (!entry.package || !entry.module || !entry.factory) {
      throw new Error('Each package entry must define package, module, and factory');
    }
    if (seenPackages.has(entry.package)) {
      throw new Error(`Duplicate package entry in manifest: ${entry.package}`);
    }
    seenPackages.add(entry.package);
  }
}

/** @param {Manifest} manifest */
function buildSource(manifest) {
  const quote = (value) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

  const importEntries = [
    { module: manifest.defaultExport.module, symbol: manifest.defaultExport.factory },
    ...manifest.packages.map((pkg) => ({ module: pkg.module, symbol: pkg.factory })),
  ];

  const uniqueImports = [...new Map(importEntries.map((i) => [`${i.module}:${i.symbol}`, i])).values()]
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  const imports = uniqueImports
    .map((item) => `import { ${item.symbol} } from '${item.module}';`)
    .join('\n');

  const packageMap = manifest.packages
    .map((pkg) => `  ${quote(pkg.package)}: ${pkg.factory},`)
    .join('\n');

  const forcedPackages = manifest.packages
    .filter((pkg) => pkg.forceEsmInServe)
    .map((pkg) => `  ${quote(pkg.package)},`)
    .join('\n');

  // For forced-serve packages we generate static wrapper modules from bare specifiers.
  // Keep named exports explicit because `export * from <cjs>` is unreliable for entries
  // that branch through conditional require() (common in react/react-dom runtime files).
  const directServeNamedExports = manifest.packages
    .filter((pkg) => pkg.forceEsmInServe && pkg.namedExports?.length)
    .map((pkg) => {
      const names = pkg.namedExports.map((n) => `'${n}'`).join(', ');
      return `  ${quote(pkg.package)}: [${names}],`;
    })
    .join('\n');

  return `${imports}

type ExportCodeFactory = () => string;

const exportCodeByPackage: Record<string, ExportCodeFactory> = {
${packageMap}
};

const forceEsmInServePackages = new Set<string>([
${forcedPackages}
]);

export function getSharedEsmExportCode(pkg: string): string {
  const exportFactory = exportCodeByPackage[pkg] || ${manifest.defaultExport.factory};
  return exportFactory();
}

export function shouldForceEsmInServe(pkg: string): boolean {
  return forceEsmInServePackages.has(pkg);
}

// Explicit named exports for the static serve path.
// 'export * from pkg' doesn't work for CJS with conditional require() because esbuild
// can't statically determine named exports. Explicit re-exports are required instead.
const directServeNamedExports: Record<string, string[]> = {
${directServeNamedExports}
};

export function getDirectServeExportCode(pkg: string): string {
  const named = directServeNamedExports[pkg] ?? [];
  const namedLines = named.map(n => \`export const \${n} = sharedModule.\${n};\`).join('\\n    ');
  return \`
    import * as sharedModule from \${JSON.stringify(pkg)};
    export default sharedModule;
    \${namedLines}
  \`;
}
`;
}

function main() {
  const manifest = readManifest();
  validateManifest(manifest);
  const generated = buildSource(manifest);
  fs.writeFileSync(outputPath, generated, 'utf8');
  console.log(`Generated ${path.relative(projectRoot, outputPath)} from ${path.relative(projectRoot, manifestPath)}`);
}

main();
