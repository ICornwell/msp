// Simple declaration to make TypeScript happy with React 19
declare module 'react' {
  import * as ReactTypes from '@types/react';
  export = ReactTypes;
  
  // Add "any" type declarations for common hooks to avoid red squiggles
  export function useRef(initialValue?: any): any;
  export function useState<T = any>(initialState?: T | (() => T)): [T, (state: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useContext(context: any): any;
  export function useReducer(reducer: any, initialArg: any, init?: any): [any, (action: any) => void];
  export function useCallback(callback: any, deps?: any[]): any;
  export function useMemo(factory: () => any, deps?: any[]): any;
  
  // Add Context and createContext
  export function createContext<T>(defaultValue: T): any;
  
  // Add FC type
  export type FC<P = {}> = (props: P) => any;
  export type ReactNode = any;
}

declare module 'react-dom' {
  export function render(element: any, container: Element): void;
  export function unmountComponentAtNode(container: Element): boolean;
}

declare module 'react-dom/client' {
  export function createRoot(container: Element): {
    render(element: any): void;
    unmount(): void;
  };
}
