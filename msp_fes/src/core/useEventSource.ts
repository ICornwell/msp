import { v4 as uuidv4 } from 'uuid';
// import { useEffect } from 'react';
import { useRef } from 'react';

export type subscribe<N,M> = (callback: ((msg: M) => void)) => N

export default function useEventSource<P, M>(
  subscribers: Map<string, ((msg: M) => void)>,
  notifiers: P) : subscribe<P,M> {
  const subscriberId = useRef<string>(uuidv4());
  return function (callback: ((msg: M) => void)) {
    subscribers.set(subscriberId.current, callback)
    return notifiers
  }
}