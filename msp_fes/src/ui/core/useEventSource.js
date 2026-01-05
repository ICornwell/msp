/// <reference path="../types/react.d.ts" />
import { v4 as uuidv4 } from 'uuid';
import { useRef, useEffect } from 'react';
export default function useEventSource(subscribers, notifiers) {
    const subscriberId = useRef(uuidv4());
    // Clean up subscription when component unmounts
    useEffect(() => {
        return () => {
            if (subscribers.has(subscriberId.current)) {
                subscribers.delete(subscriberId.current);
            }
        };
    }, [subscribers]);
    return function (callback) {
        subscribers.set(subscriberId.current, callback);
        return notifiers;
    };
}
//# sourceMappingURL=useEventSource.js.map