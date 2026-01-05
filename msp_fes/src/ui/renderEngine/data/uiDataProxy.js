import DeepProxy from "proxy-deep";
import { v4 as uuidv4 } from 'uuid';
export function getSourceDataProxy(data, pubsub) {
    const proxySubscriberId = uuidv4();
    const proxySubscribers = [];
    //wrap the metadata mode in an object so we can modify it in closures
    let metadataMode = { value: false };
    const recordNotes = new Map();
    const recordExpressions = new Map();
    // function to set metadata mode
    function setMetadataMode(mode) {
        metadataMode.value = mode;
    }
    // setter abstracted for reuse
    function set(target, subscriptionHandler, p, value, receiver, path) {
        const oldValue = Reflect.get(target, p, receiver);
        const r = Reflect.set(target, p, value, receiver);
        publishEvent('dataChange', subscriptionHandler, (newValue) => set(target, subscriptionHandler, p, newValue, receiver, path), path, p, value, oldValue);
        return r;
    }
    function getKeyedPropertySubscriber(key, path) {
        return (subscriber) => {
            const singlePropertyMsgTypeFilter = (msg) => {
                return msg.propertyKey === key
                    && msg.path === path.join('.')
                    && (!subscriber.msgTypeFilter || subscriber.msgTypeFilter(msg));
            };
            return pubsub.subscribe({ callback: subscriber.callback, msgTypeFilter: singlePropertyMsgTypeFilter });
        };
    }
    function getKeyedPropertySubscriberHandler(key, path) {
        return {
            subscribeToPubSub: getKeyedPropertySubscriber(key, path),
            unsubscribeFromPubSub: (subscriberId) => {
                pubsub.unsubscribe(subscriberId);
            },
            unsubscribeFromAllPubSub: () => {
                unsubscribeToAllProxyProperties();
            }
        };
    }
    const sourceData = new DeepProxy(data, {
        get(target, key, receiver) {
            const stringKey = key.toString();
            if (stringKey === '___isProxy') {
                return true;
            }
            if (stringKey === '___proxyPubSub') {
                return {
                    subscriptionHandler: {
                        subscribeToPubSub: subscribeToProxy,
                        unsubscribeFromPubSub: unsubscribeToProxy,
                        unsubscribeFromAllPubSub: unsubscribeToAllProxyProperties
                    },
                    setMetadataMode
                };
            }
            if (stringKey === '___Notes') {
                return {
                    notes: recordNotes,
                    expressions: recordExpressions
                };
            }
            const val = Reflect.get(target, key, receiver);
            let isObject = false;
            let objVal = undefined;
            if (typeof val === 'object' && val !== null) {
                isObject = true;
                objVal = this.nest(val);
            }
            else {
                isObject = false;
                objVal = val;
            }
            const subHandler = getKeyedPropertySubscriberHandler(key, this.path);
            const fullKeyPath = [...this.path, key.toString()].join('.');
            const notes = {
                hasNotes: recordNotes.has(fullKeyPath),
                getNotes: () => {
                    return recordNotes.get(fullKeyPath) || [];
                },
                setNotes: (newNotes) => {
                    recordNotes.set(fullKeyPath, newNotes);
                },
                getExpression: () => {
                    return recordExpressions.get(fullKeyPath) || [];
                },
                setExpression: (newNotes) => {
                    recordExpressions.set(fullKeyPath, newNotes);
                }
            };
            publishEvent('dataFetch', subHandler, (newValue) => set(target, subHandler, key, newValue, receiver, this.path), this.path, key, objVal, undefined, notes);
            return metadataMode.value ? {
                __isProxyMetadata: true,
                path: this.path,
                key: key,
                value: objVal,
                setter: (newValue) => set(target, subHandler, key, newValue, receiver, this.path),
                subscriptionHandler: subHandler,
                notes: notes
            } : objVal;
        },
        set(target, p, value, receiver) {
            return set(target, getKeyedPropertySubscriberHandler(p, this.path), p, value, receiver, this.path);
        },
    });
    function publishEvent(messageType, subscriptionHandler, setter, path, p, value, oldValue, notes) {
        pubsub.publish({
            messageType: messageType,
            recordSubscriberId: proxySubscriberId,
            path: path.join('.'),
            propertyKey: p,
            newValue: value,
            oldValue: oldValue,
            subscriptionHandler,
            setter: setter,
            notes: notes
        });
    }
    function unsubscribeToAllProxyProperties() {
        for (const subscriberId of proxySubscribers) {
            pubsub.unsubscribe(subscriberId);
        }
    }
    function unsubscribeToProxy(subscriberId) {
        pubsub.unsubscribe(subscriberId);
    }
    function subscribeToProxy(subscription) {
        const subscriberId = pubsub.subscribe(subscription);
        return subscriberId;
    }
    return {
        sourceData,
        subscriptionHandler: {
            subscribeToPubSub: subscribeToProxy,
            unsubscribeFromPubSub: unsubscribeToProxy,
            unsubscribeFromAllPubSub: unsubscribeToAllProxyProperties
        },
        setMetadataMode
    };
}
//# sourceMappingURL=uiDataProxy.js.map