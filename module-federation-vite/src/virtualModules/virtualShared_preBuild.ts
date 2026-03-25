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
  getSharedEsmExportCode,
} from './sharedEsmExports';
import { virtualRuntimeInitStatus } from './virtualRuntimeInitStatus';

function buildStaticReExportCode(pkg: string): string {
  return `import * as sharedModule from ${JSON.stringify(pkg)};\nexport default sharedModule;\n`;
}

// *** __prebuild__
const preBuildCacheMap: Record<string, VirtualModule> = {};
export const PREBUILD_TAG = '__prebuild__';
export function writePreBuildLibPath(pkg: string) {
  if (!preBuildCacheMap[pkg]) preBuildCacheMap[pkg] = new VirtualModule(pkg, PREBUILD_TAG);
  preBuildCacheMap[pkg].writeSync(buildStaticReExportCode(pkg), true);
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
export function getLoadShareImportId(pkg: string): string {
  if (!loadShareCacheMap[pkg])
    loadShareCacheMap[pkg] = new VirtualModule(pkg, LOAD_SHARE_TAG, '.js');
  return loadShareCacheMap[pkg].getImportId();
}
export function writeLoadShareModule(pkg: string, shareItem: ShareItem, command: string) {
  if (!loadShareCacheMap[pkg])
    loadShareCacheMap[pkg] = new VirtualModule(pkg, LOAD_SHARE_TAG, '.js');
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
    console.log('[MF] CJS loadShare initiated for '+${JSON.stringify(pkg)})
    let exportModule = ${command !== 'build' ? '/*mf top-level-await placeholder replacement mf*/' : 'await '}res.then(factoryOrModule => typeof factoryOrModule === 'function' ? factoryOrModule() : factoryOrModule)
    module.exports = exportModule
  `);
}

export function writeLoadShareModuleESM(pkg: string, shareItem: ShareItem, command: string) {
  if (!loadShareCacheMap[pkg])
    loadShareCacheMap[pkg] = new VirtualModule(pkg, LOAD_SHARE_TAG, '.js');
  const prebuildWarmupImport = command === 'serve'
    ? ''
    : `;() => import(${JSON.stringify(getPreBuildLibImportId(pkg))}).catch(() => {});`;

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
    // No fallback import in serve mode: awaiting the prebuild chunk would
    // create a circular TLA deadlock (prebuild re-imports this same package
    // via the MF alias → back to this module mid-evaluation).
    // loadShare always succeeds for host-registered shared deps.
    const moduleFactory = await res
      .then(factoryOrModule => typeof factoryOrModule === 'function' ? factoryOrModule() : factoryOrModule)
    // ESM re-export instead of module.exports
    ${exportCode}
  `);
}
