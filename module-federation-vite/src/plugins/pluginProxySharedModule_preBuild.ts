import { Plugin, UserConfig } from 'vite';
import { mapCodeToCodeWithSourcemap } from '../utils/mapCodeToCodeWithSourcemap';
import { NormalizedShared } from '../utils/normalizeModuleFederationOptions';
import { PromiseStore } from '../utils/PromiseStore';
import VirtualModule, { assertModuleFound } from '../utils/VirtualModule';
import {
  addUsedShares,
  generateLocalSharedImportMap,
  getLoadShareModulePath,
  getLocalSharedImportMapPath,
  PREBUILD_TAG,
  writeLoadShareModule,
  writeLoadShareModuleESM,
  writeLocalSharedImportMap,
  writePreBuildLibPath,
} from '../virtualModules';
import { parsePromise } from './pluginModuleParseEnd';

export function proxySharedModule(options: {
  shared?: NormalizedShared;
  include?: string | string[];
  exclude?: string | string[];
}): Plugin[] {
  let { shared = {}, include, exclude } = options;
  let _config: UserConfig;
  return [
    {
      name: 'generateLocalSharedImportMap',
      enforce: 'post',
      load(id: any) {
        if (id.includes(getLocalSharedImportMapPath())) {
          return parsePromise.then((_) => generateLocalSharedImportMap());
        }
      },
      transform(_, id) {
        if (id.includes(getLocalSharedImportMapPath())) {
          return mapCodeToCodeWithSourcemap(
            parsePromise.then((_) => generateLocalSharedImportMap())
          );
        }
      },
    },
    {
      name: 'proxyPreBuildShared',
      enforce: 'post',
      configResolved(config: any) {
        _config = config as any;
      },
      config(config: UserConfig, { command }: any) {
        (config.resolve as any).alias.push(
          ...Object.keys(shared).map((key) => {
            const pattern = key.endsWith('/')
              ? `(^${key.replace(/\/$/, '')}(\/.+)?$)`
              : `(^${key}$)`;
            return {
              // Intercept all shared requests and proxy them to loadShare
              find: new RegExp(pattern),
              replacement: '$1',
              customResolver(source: string, importer: string) {
                if (/\.css$/.test(source)) return;
                // Avoid proxying shared imports that originate from our generated
                // virtual modules, otherwise they can alias back to themselves.
                if (importer && importer.includes('__mf__virtual')) return null;
                // Also skip imports from __mf__temp (localSharedImportMap etc.)
                if (importer && importer.includes('__mf__temp')) return null;
                // Only proxy application imports. If a dependency inside node_modules
                // requests a shared package (e.g. react-dom -> react), let it resolve
                // normally so CJS expectations are preserved.
                if (importer && /[\\/]node_modules[\\/]/.test(importer)) return null;
                // During esbuild dep optimisation, top-level include entries are
                // resolved with an empty-string importer. We must NOT intercept those:
                // the optimized dep must contain the real package bytes, not the
                // loadShare TLA wrapper. If the wrapper is baked in, all subsequent
                // prebuild→import(pkg) calls during serve get the wrapper back and
                // moduleFactory ends up undefined.
                if (!importer) return null;
                // Also skip non-JS source importers (e.g. index.html). The dep
                // optimizer crawls from HTML entry points — if we redirect their
                // shared-package imports to loadShare wrappers, esbuild bundles the
                // TLA wrapper into the optimized dep instead of the real package.
                if (importer && !/\.[cm]?[jt]sx?$/.test(importer)) return null;
                const loadSharePath = getLoadShareModulePath(source);
                const sharedItem = shared[key];

                if (sharedItem.shareConfig.isEsm) {
                  writeLoadShareModuleESM(source, sharedItem, command);
                } else {
                  writeLoadShareModule(source, sharedItem, command);
                }
                writePreBuildLibPath(source);
                addUsedShares(source);
                writeLocalSharedImportMap();
                return (this as any).resolve(loadSharePath, importer);
              },
            };
          })
        );
        const savePrebuild = new PromiseStore<string>();

        (config.resolve as any).alias.push(
          ...Object.keys(shared).map((key) => {
            return command === 'build'
              ? {
                find: new RegExp(`(.*${PREBUILD_TAG}.*)`),
                replacement: function ($1: string) {
                  const module = assertModuleFound(PREBUILD_TAG, $1) as VirtualModule;
                  const pkgName = module.name;
                  return pkgName;
                },
              }
              : {
                find: new RegExp(`(.*${PREBUILD_TAG}.*)`),
                replacement: '$1',
                async customResolver(source: string, importer: string) {
                  const module = assertModuleFound(PREBUILD_TAG, source) as VirtualModule;
                  const pkgName = module.name;
                  const result = await (this as any)
                    .resolve(pkgName, importer)
                    .then((item: any) => item.id);
                  if (!result.includes(_config.cacheDir)) {
                    // save pre-bunding module id
                    savePrebuild.set(pkgName, Promise.resolve(result));
                  }
                  writePreBuildLibPath(pkgName);
                  // Fix localSharedImportMap import id
                  return await (this as any).resolve(await savePrebuild.get(pkgName), importer);
                },
              };
          })
        );
      },
    },
  ];
}
