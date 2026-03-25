import defu from 'defu';
import { Plugin } from 'vite';
import addEntry from './plugins/pluginAddEntry';
import { PluginDevProxyModuleTopLevelAwait } from './plugins/pluginDevProxyModuleTopLevelAwait';
import pluginManifest from './plugins/pluginMFManifest';
import pluginModuleParseEnd from './plugins/pluginModuleParseEnd';
import pluginProxyRemoteEntry from './plugins/pluginProxyRemoteEntry';
import pluginProxyRemotes from './plugins/pluginProxyRemotes';
import { proxySharedModule } from './plugins/pluginProxySharedModule_preBuild';
import aliasToArrayPlugin from './utils/aliasToArrayPlugin';
import {
  ModuleFederationOptions,
  normalizeModuleFederationOptions,
} from './utils/normalizeModuleFederationOptions';
import normalizeOptimizeDepsPlugin from './utils/normalizeOptimizeDeps';
import VirtualModule from './utils/VirtualModule';
import {
  addUsedShares,
  getHostAutoInitImportId,
  getHostAutoInitPath,
  getLocalSharedImportMapPath,
  initVirtualModules,
  REMOTE_ENTRY_ID,
  virtualRuntimeInitStatus,
  writeHostAutoInit,
  writeLoadShareModule,
  writePreBuildLibPath
} from './virtualModules';
import { VIRTUAL_EXPOSES } from './virtualModules/virtualExposes';
import { writeRuntimeInitStatus } from './virtualModules/virtualRuntimeInitStatus';

function federation(mfUserOptions: ModuleFederationOptions): Plugin[] {
  const options = normalizeModuleFederationOptions(mfUserOptions);
  const { name, remotes, shared, filename, hostInitInjectLocation } = options;
  if (!name) throw new Error('name is required');

  return [
    {
      name: 'vite:module-federation-config',
      enforce: 'pre',
      configResolved(config) {
        // Set root path
        VirtualModule.setRoot(config.root);
        // Ensure virtual package directory exists
        VirtualModule.ensureVirtualPackageExists();
        initVirtualModules();
      },
    },
    aliasToArrayPlugin,
    normalizeOptimizeDepsPlugin,
    ...addEntry({
      entryName: 'remoteEntry',
      entryPath: REMOTE_ENTRY_ID,
      fileName: filename,
    }),
    ...addEntry({
      entryName: 'hostInit',
      entryPath: getHostAutoInitPath(),
      inject: hostInitInjectLocation,
    }),
    ...addEntry({
      entryName: 'virtualExposes',
      entryPath: VIRTUAL_EXPOSES,
    }),
    pluginProxyRemoteEntry(),
    pluginProxyRemotes(options),
    ...pluginModuleParseEnd((id: string) => {
      return (
        id.includes(getHostAutoInitImportId()) ||
        id.includes(REMOTE_ENTRY_ID) ||
        id.includes(VIRTUAL_EXPOSES) ||
        id.includes(getLocalSharedImportMapPath())
      );
    }),
    ...proxySharedModule({
      shared,
    }),
    PluginDevProxyModuleTopLevelAwait(),
    {
      name: 'module-federation-vite',
      enforce: 'post',
      // @ts-expect-error
      // used to expose plugin options: https://github.com/rolldown/rolldown/discussions/2577#discussioncomment-11137593
      _options: options,
      config(config, { command: _command }: { command: string }) {
        // TODO: singleton
        (config.resolve as any).alias.push({
          find: '@module-federation/runtime',
          replacement: options.implementation,
        });
        config.build = defu(config.build || {}, {
          commonjsOptions: {
            strictRequires: 'auto',
          },
        });
        config.optimizeDeps?.include?.push('@module-federation/runtime');
        // Do NOT push the bare virtualDir — Vite would scan all files in that
        // directory including loadShare modules that don't exist yet, causing
        // ENOENT crashes. Individual IDs are registered per-module below.
        config.optimizeDeps?.needsInterop?.push(getLocalSharedImportMapPath());

        if (_command === 'serve') {
          // Set root early so VirtualModule can find node_modules before
          // configResolved fires. Without this, file writes use process.cwd().
          VirtualModule.setRoot((config as any).root || process.cwd());

          // Write all virtual module files so they exist on disk before Vite
          // starts. Files NOT in include still need to exist for when Vite's
          // module runner encounters them at request time.
          writeRuntimeInitStatus();
          writeHostAutoInit();
          for (const shareKey of Object.keys(shared || {})) {
            writePreBuildLibPath(shareKey);
            writeLoadShareModule(shareKey, shared![shareKey], _command);
            // Pre-populate usedShares so localSharedImportMap is fully written
            // by initVirtualModules() in configResolved. Without this, the map
            // is empty at startup and loadShare() returns undefined for all
            // shared deps (including react), causing runtime errors.
            addUsedShares(shareKey);
          }

          // runtimeInit is now ESM (uses export let/const) so no interop needed.
          // prebuild/* and loadShare/* are served as raw ESM by Vite's module
          // runner — they don't go through esbuild at all. The real packages
          // they re-export (react, msp_ui_common/*, @mui/*, etc.) are already
          // in optimizeDeps.include via Object.keys(sharedDeps) in vite.config,
          // so esbuild discovers all shared packages in the first pass.
          // Adding prebuildIds to include here would cause double-registration:
          // esbuild processes prebuild → finds the real pkg import → re-runs.
          const runtimeInitId = virtualRuntimeInitStatus.getImportId();
          if (!config.optimizeDeps?.include?.includes(runtimeInitId)) {
            config.optimizeDeps?.include?.push(runtimeInitId);
          }
        }
      },
    },
    ...pluginManifest(),
  ];
}

export { federation };
