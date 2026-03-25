// ─── Factory-file generator metadata (tooling-only — dropped from sharedDeps output) ──────

/**
 * Discriminated union that drives the sharedEsmExports factory file generator.
 *  mode 'default-only' — emit a simple delegate to defaultExportCode() (no named exports)
 *  mode 'list'         — use the namedExports already in registry.manifest.json, or the
 *                        inline `exports` array when you want to provide a curated subset
 *  mode 'scan'         — run the esmExportEnumerator to get the full live export list
 *  mode 'imports'      — scan the monorepo for what is actually imported from this package
 */
export type FactoryGenMeta =
  | { mode: 'default-only' }
  | {
      mode: 'list';
      defaultDepth?: 1 | 3;   // CJS interop depth; default 1
      sentinel?: string;        // key used to detect module candidate; default: first export
      exports?: string[];        // inline curated list; absent → read from manifest namedExports
    }
  | { mode: 'scan';    defaultDepth?: 1 | 3; sentinel?: string }
  | { mode: 'imports'; defaultDepth?: 1 | 3; sentinel?: string };

type VersionInfo = {
  version: string;
  isEsm: boolean;
  /** Tooling-only — stripped during the sharedDeps reduce, invisible to MF runtime */
  gen?: FactoryGenMeta;
}

// ─── Shared package registry ──────────────────────────────────────────────────

export const sharedVersions: Record<string, VersionInfo> = {
  'react': {
    version: '*', isEsm: false,
    gen: { mode: 'list', defaultDepth: 3, sentinel: 'createContext' },
  },
  'react-dom': {
    version: '*', isEsm: false,
    gen: { mode: 'list', sentinel: 'createPortal' },
  },
  'react-dom/client': {
    version: '*', isEsm: false,
    gen: { mode: 'list', sentinel: 'createRoot' },
  },
  'react/jsx-runtime': {
    version: '*', isEsm: false,
    gen: { mode: 'list', sentinel: 'jsx' },
  },
  'react/jsx-dev-runtime': {
    version: '*', isEsm: false,
    gen: { mode: 'list', sentinel: 'jsxDEV' },
  },
  '@azure/msal-browser': {
    version: '*', isEsm: false,
    gen: { mode: 'list', sentinel: 'PublicClientApplication' },
  },
  '@azure/msal-react': {
    version: '*', isEsm: false,
    gen: { mode: 'list', sentinel: 'MsalProvider' },
  },
  '@azure/msal-common': {
    version: '*', isEsm: false,
    gen: { mode: 'list', sentinel: 'AuthError' },
  },
  '@emotion/react': {
    version: '*', isEsm: false,
    gen: { mode: 'default-only' },
  },
  '@emotion/styled': {
    version: '*', isEsm: false,
    gen: { mode: 'default-only' },
  },
  '@emotion/cache': {
    version: '*', isEsm: false,
    gen: { mode: 'default-only' },
  },
  '@emotion/react/jsx-runtime': {
    version: '*', isEsm: false,
    gen: { mode: 'default-only' },
  },
  '@mui/styled-engine': {
    version: '*', isEsm: false,
    gen: { mode: 'default-only' },
  },
  '@mui/material': {
    version: '*', isEsm: false,
    gen: { mode: 'default-only' },
  },
  '@mui/system': {
    version: '*', isEsm: false,
    gen: { mode: 'default-only' },
  },
  '@mui/icons-material': {
    version: '*', isEsm: false,
    gen: { mode: 'default-only' },
  },
  'msp_ui_common': {
    version: '*', isEsm: false,
    gen: { mode: 'list', sentinel: 'Re' },
  },
  'msp_ui_common/uiLib': {
    version: '*', isEsm: false,
    gen: { mode: 'list', sentinel: 'Re' },
  },
  'msp_ui_common/uiLib/components': {
    version: '*', isEsm: false,
    gen: { mode: 'list', sentinel: 'AppShell' },
  },
  'msp_ui_common/uiLib/contexts': {
    version: '*', isEsm: false,
    gen: { mode: 'list', sentinel: 'UiEventProvider' },
  },
  'msp_ui_common/uiLib/comms': {
    version: '*', isEsm: false,
    gen: { mode: 'list', sentinel: 'getAvailableFeatures' },
  },
  'msp_ui_common/uiLib/behaviours': {
    version: '*', isEsm: false,
    gen: { mode: 'list', sentinel: 'Behaviour' },
  },
  'msp_ui_common/uiLib/hooks': {
    version: '*', isEsm: false,
    gen: { mode: 'list', sentinel: 'useUserSession' },
  },
  'msp_ui_common/uiLib/renderEngine': {
    version: '*', isEsm: false,
    gen: { mode: 'list', sentinel: 'Re' },
  },
}

type DependencyInfo = { singleton: boolean; requiredVersion: string | false; isEsm: boolean }
type Dependencies = Record<string, DependencyInfo>

export const sharedDeps: Dependencies = Object.entries(sharedVersions).reduce(
  (deps, [packageName, info]) => {
    deps[packageName] = {
      singleton: true,
      requiredVersion: info.version,
      isEsm: info.isEsm
    }
    return deps
  },
  {} as Dependencies
)

export default sharedDeps

export type { DependencyInfo, Dependencies }