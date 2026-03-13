import { defaultExportCode } from './defaultExport';
import { emotionReactExportCode } from './emotionReact';
import { emotionStyledExportCode } from './emotionStyled';
import { muiIconsMaterialExportCode } from './muiIconsMaterial';
import { muiMaterialExportCode } from './muiMaterial';
import { muiSystemExportCode } from './muiSystem';
import { reactDomClientExportCode } from './reactDomClient';
import { reactDomExportCode } from './reactDom';
import { reactExportCode } from './react';
import { reactJsxDevRuntimeExportCode } from './reactJsxDevRuntime';
import { reactJsxRuntimeExportCode } from './reactJsxRuntime';

type ExportCodeFactory = () => string;

const exportCodeByPackage: Record<string, ExportCodeFactory> = {
  'react': reactExportCode,
  'react-dom': reactDomExportCode,
  'react-dom/client': reactDomClientExportCode,
  'react/jsx-runtime': reactJsxRuntimeExportCode,
  'react/jsx-dev-runtime': reactJsxDevRuntimeExportCode,
  '@mui/material': muiMaterialExportCode,
  '@mui/system': muiSystemExportCode,
  '@mui/icons-material': muiIconsMaterialExportCode,
  '@emotion/react': emotionReactExportCode,
  '@emotion/styled': emotionStyledExportCode,
};

const forceEsmInServePackages = new Set<string>([
  'react',
  'react-dom',
  'react-dom/client',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
]);

export function getSharedEsmExportCode(pkg: string): string {
  const exportFactory = exportCodeByPackage[pkg] || defaultExportCode;
  return exportFactory();
}

export function shouldForceEsmInServe(pkg: string): boolean {
  return forceEsmInServePackages.has(pkg);
}

// Explicit named exports for the static serve path.
// 'export * from pkg' doesn't work for CJS with conditional require() because esbuild
// can't statically determine named exports. Explicit re-exports are required instead.
const directServeNamedExports: Record<string, string[]> = {
  'react': ['Children', 'Component', 'Fragment', 'Profiler', 'PureComponent', 'StrictMode', 'Suspense', 'cloneElement', 'createContext', 'createElement', 'createRef', 'forwardRef', 'isValidElement', 'lazy', 'memo', 'startTransition', 'use', 'useActionState', 'useCallback', 'useContext', 'useDebugValue', 'useDeferredValue', 'useEffect', 'useId', 'useImperativeHandle', 'useInsertionEffect', 'useLayoutEffect', 'useMemo', 'useOptimistic', 'useReducer', 'useRef', 'useState', 'useSyncExternalStore', 'useTransition', 'version'],
  'react-dom': ['createPortal', 'flushSync', 'unstable_batchedUpdates', 'version'],
  'react-dom/client': ['createRoot', 'hydrateRoot', 'version'],
  'react/jsx-runtime': ['Fragment', 'jsx', 'jsxs'],
  'react/jsx-dev-runtime': ['Fragment', 'jsxDEV'],
};

export function getDirectServeExportCode(pkg: string): string {
  const named = directServeNamedExports[pkg] ?? [];
  const namedLines = named.map(n => `export const ${n} = sharedModule.${n};`).join('\n    ');
  return `
    import * as sharedModule from ${JSON.stringify(pkg)};
    export default sharedModule;
    ${namedLines}
  `;
}
