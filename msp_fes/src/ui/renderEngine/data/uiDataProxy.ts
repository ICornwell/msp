import DeepProxy from "proxy-deep";
import { v4 as uuidv4 } from 'uuid';
import { RePubSub, RePubSubMsg, ReSubscription } from "./ReEnginePubSub";
import { ReSubscriptionHandler } from "../components/RePubSubHook";

export function getSourceDataProxy(data: any, pubsub: RePubSub) {
  const proxySubscriberId = uuidv4();
  const proxySubscribers: string[] = []

  //wrap the metadata mode in an object so we can modify it in closures
  let metadataMode = { value: false };

  // function to set metadata mode
  function setMetadataMode(mode: boolean) {
    metadataMode.value = mode
  }

  // setter abstracted for reuse
  function set(target: any, subscriptionHandler: ReSubscriptionHandler, p: PropertyKey, value: any, receiver: any, path: string[]) {
    const oldValue = Reflect.get(target, p, receiver);
    const r = Reflect.set(target, p, value, receiver);
    publishEvent('dataChange', subscriptionHandler, (newValue: any) => set(target, subscriptionHandler, p, newValue, receiver, path), path, p, value, oldValue);
    return r
  }

  function getKeyedPropertySubscriber(key: string | symbol | number, path: string[]) {
    return (subscriber: ReSubscription) => {
      const singlePropertyMsgTypeFilter = (msg: RePubSubMsg) => {
        return msg.propertyKey === key
          && msg.path === path.join('.')
          && (!subscriber.msgTypeFilter || subscriber.msgTypeFilter(msg));
      }
      return pubsub.subscribe({ callback: subscriber.callback, msgTypeFilter: singlePropertyMsgTypeFilter });
    }
  }

  function getKeyedPropertySubscriberHandler(key: string | symbol | number, path: string[]): ReSubscriptionHandler {
    return {
      subscribeToPubSub: getKeyedPropertySubscriber(key, path),
      unsubscribeFromPubSub: (subscriberId: string) => {
        pubsub.unsubscribe(subscriberId);
      },
      unsubscribeFromAllPubSub: () => {
        unsubscribeToAllProxyProperties();
      }
    }
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
      const val = Reflect.get(target, key, receiver);
      let isObject = false;
      let objVal: any = undefined
      if (typeof val === 'object' && val !== null) {
        isObject = true;
        objVal = this.nest(val)
      } else {
        isObject = false;
        objVal = val;
      }

      const subNandler = getKeyedPropertySubscriberHandler(key, this.path);

      publishEvent('dataFetch', subNandler,
        (newValue) => set(target, subNandler, key, newValue, receiver, this.path),
        this.path, key, objVal, undefined);

      return metadataMode.value ? {
        __isProxyMetadata: true,
        path: this.path,
        key: key,
        value: objVal,
        setter: (newValue: any): any => set(target, subNandler, key, newValue, receiver, this.path),
        subscriptionHandler: subNandler
      } : objVal;

    },

    set(target, p, value, receiver) {
      return set(target, getKeyedPropertySubscriberHandler(p, this.path), p, value, receiver, this.path);
    },
  })

  function publishEvent(messageType: string,
    subscriptionHandler: ReSubscriptionHandler,
    setter: (newValue: any) => void,
    path: string[], p: PropertyKey, value: any, oldValue: any) {
    pubsub.publish({
      messageType: messageType,
      recordSubscriberId: proxySubscriberId,
      path: path.join('.'),
      propertyKey: p,
      newValue: value,
      oldValue: oldValue,
      subscriptionHandler,
      setter: setter
    } as RePubSubMsg);
  }

  function unsubscribeToAllProxyProperties() {
    for (const subscriberId of proxySubscribers) {
      pubsub.unsubscribe(subscriberId);
    }
  }

  function unsubscribeToProxy(subscriberId: string) {
    pubsub.unsubscribe(subscriberId);
  }

  function subscribeToProxy(subscription: ReSubscription): string {
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