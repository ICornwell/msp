export function reactExportCode(): string {
  return `
    const fallbackCandidates = typeof fallbackModule !== 'undefined' ? [
      fallbackModule,
      fallbackModule?.default,
      fallbackModule?.default?.default,
      fallbackModule?.default?.default?.default,
    ] : [];

    const candidates = [
      moduleFactory,
      moduleFactory?.default,
      moduleFactory?.default?.default,
      moduleFactory?.default?.default?.default,
      ...fallbackCandidates,
    ];

    const pick = (key) => {
      for (const candidate of candidates) {
        if (candidate && candidate[key] !== undefined) {
          return candidate[key];
        }
      }
      return undefined;
    };

    const sharedModule = pick('createContext') ? candidates.find((candidate) => candidate && candidate.createContext) : (moduleFactory?.default?.default ?? moduleFactory?.default ?? moduleFactory);
    export default sharedModule;
    export const Children = pick('Children');
    export const Component = pick('Component');
    export const Fragment = pick('Fragment');
    export const Profiler = pick('Profiler');
    export const PureComponent = pick('PureComponent');
    export const StrictMode = pick('StrictMode');
    export const Suspense = pick('Suspense');
    export const cloneElement = pick('cloneElement');
    export const createContext = pick('createContext');
    export const createElement = pick('createElement');
    export const createRef = pick('createRef');
    export const forwardRef = pick('forwardRef');
    export const isValidElement = pick('isValidElement');
    export const lazy = pick('lazy');
    export const memo = pick('memo');
    export const startTransition = pick('startTransition');
    export const use = pick('use');
    export const useActionState = pick('useActionState');
    export const useCallback = pick('useCallback');
    export const useContext = pick('useContext');
    export const useDebugValue = pick('useDebugValue');
    export const useDeferredValue = pick('useDeferredValue');
    export const useEffect = pick('useEffect');
    export const useId = pick('useId');
    export const useImperativeHandle = pick('useImperativeHandle');
    export const useInsertionEffect = pick('useInsertionEffect');
    export const useLayoutEffect = pick('useLayoutEffect');
    export const useMemo = pick('useMemo');
    export const useOptimistic = pick('useOptimistic');
    export const useReducer = pick('useReducer');
    export const useRef = pick('useRef');
    export const useState = pick('useState');
    export const useSyncExternalStore = pick('useSyncExternalStore');
    export const useTransition = pick('useTransition');
    export const version = pick('version');
  `;
}
