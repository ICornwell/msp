/**
 * Even the resolveId hook cannot interfere with vite pre-build,
 * and adding query parameter virtual modules will also fail.
 * You can only proxy to the real file through alias
 */
/**
 * shared will be proxied:
 * 1. __prebuild__: export shareModule (pre-built source code of modules such as vue, react, etc.)
 * 2. __loadShare__: load shareModule (mfRuntime.loadShare('vue'))
 */

import { ShareItem } from '../utils/normalizeModuleFederationOptions';
import VirtualModule from '../utils/VirtualModule';
import {
  getDirectServeExportCode,
  getSharedEsmExportCode,
  shouldForceEsmInServe,
} from './sharedEsmExports';
import { virtualRuntimeInitStatus } from './virtualRuntimeInitStatus';

// *** __prebuild__
const preBuildCacheMap: Record<string, VirtualModule> = {};
export const PREBUILD_TAG = '__prebuild__';
export function writePreBuildLibPath(pkg: string) {
  if (!preBuildCacheMap[pkg]) preBuildCacheMap[pkg] = new VirtualModule(pkg, PREBUILD_TAG);
  preBuildCacheMap[pkg].writeSync(getDirectServeExportCode(pkg), true);
}
export function getPreBuildLibImportId(pkg: string): string {
  if (!preBuildCacheMap[pkg]) preBuildCacheMap[pkg] = new VirtualModule(pkg, PREBUILD_TAG);
  const importId = preBuildCacheMap[pkg].getImportId();
  return importId;
}

// *** __loadShare__
export const LOAD_SHARE_TAG = '__loadShare__';

const loadShareCacheMap: Record<string, VirtualModule> = {};
export function getLoadShareModulePath(pkg: string): string {
  if (!loadShareCacheMap[pkg])
    loadShareCacheMap[pkg] = new VirtualModule(pkg, LOAD_SHARE_TAG, '.js');
  const filepath = loadShareCacheMap[pkg].getPath();
  return filepath;
}
export function writeLoadShareModule(pkg: string, shareItem: ShareItem, command: string) {
  if (command !== 'build') {
    // In serve mode, virtual modules are executed as browser ESM. Never emit
    // CommonJS require/module.exports wrappers there.
    writeLoadShareModuleESM(pkg, shareItem, command);
    return;
  }

  const prebuildWarmupImport = `;() => import(${JSON.stringify(getPreBuildLibImportId(pkg))}).catch(() => {});`;

  loadShareCacheMap[pkg].writeSync(`

    ${prebuildWarmupImport}
    const {loadShare} = require("@module-federation/runtime")
    const {initPromise} = require("${virtualRuntimeInitStatus.getImportId()}")
    const res = initPromise.then(_ => loadShare(${JSON.stringify(pkg)}, {
    customShareInfo: {shareConfig:{
      singleton: ${shareItem.shareConfig.singleton},
      strictVersion: ${shareItem.shareConfig.strictVersion},
      requiredVersion: ${JSON.stringify(shareItem.shareConfig.requiredVersion)}
    }}}))
    let exportModule = ${command !== 'build' ? '/*mf top-level-await placeholder replacement mf*/' : 'await '}res.then(factoryOrModule => typeof factoryOrModule === 'function' ? factoryOrModule() : factoryOrModule)
    module.exports = exportModule
  `);
}

export function writeLoadShareModuleESM(pkg: string, shareItem: ShareItem, command: string) {
  const useDirectPrebuildInServe = command !== 'build' && shouldForceEsmInServe(pkg);

  if (useDirectPrebuildInServe) {
    // In serve mode for known ESM-safe packages: emit a static re-export from the
    // bare specifier so Vite's own CJS→ESM interop handles it — no async initPromise,
    // no dynamic import(), no top-level-await that blocks module evaluation.
    // Explicit named exports required because 'export * from CJS' doesn't work when
    // the CJS entry uses a conditional require() that esbuild can't statically analyze.
    loadShareCacheMap[pkg].writeSync(getDirectServeExportCode(pkg));
    return;
  }

  const prebuildWarmupImport = command === 'serve'
    ? ''
    : `;() => import(${JSON.stringify(getPreBuildLibImportId(pkg))}).catch(() => {});`;
  const prebuildImportId = JSON.stringify(getPreBuildLibImportId(pkg));

  const exportCode = getSharedEsmExportCode(pkg);

  loadShareCacheMap[pkg].writeSync(`

    ${prebuildWarmupImport}
    import {loadShare} from "@module-federation/runtime"
    const {initPromise} = await import("${virtualRuntimeInitStatus.getImportId()}")
    const res = initPromise.then(_ => loadShare(${JSON.stringify(pkg)}, {
    customShareInfo: {shareConfig:{
      singleton: ${shareItem.shareConfig.singleton},
      strictVersion: ${shareItem.shareConfig.strictVersion},
      requiredVersion: ${JSON.stringify(shareItem.shareConfig.requiredVersion)}
    }}}))

    const fallbackModule = await import(${prebuildImportId}).then(m => ((m) => m?.__esModule ? m : { ...typeof m === "object" && !Array.isArray(m) || typeof m === "function" ? m : {}, default: m })(m.default)).catch(() => undefined)
    const moduleFactory = await res
      .then(factoryOrModule => typeof factoryOrModule === 'function' ? factoryOrModule() : factoryOrModule)
      .catch(() => fallbackModule)
    // ESM re-export instead of module.exports
    ${exportCode}
  `);
}
