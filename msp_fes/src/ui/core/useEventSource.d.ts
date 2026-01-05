export type subscribe<N, M> = (callback: ((msg: M) => void)) => N;
export default function useEventSource<P, M>(subscribers: Map<string, ((msg: M) => void)>, notifiers: P): subscribe<P, M>;
