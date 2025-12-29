import { isTestEnvironment } from './hooks-debug';

export default function createPubSubSub() {
  const subscribers = new Map<string, Function>();

  function subscribe(subscriberId: string, callback: Function) {
    if (!subscribers.has(subscriberId)) {
      subscribers.set(subscriberId, callback);
    }
  }

  function unsubscribe(subscriberId: string) {
    const subscriberIdSubscribers = subscribers.get(subscriberId);
    if (subscriberIdSubscribers) {
      subscribers.delete(subscriberId);
    }
  }

  function publish(data: any) {
    // In test environments, we use a simpler synchronous approach
    // to avoid issues with Happy DOM and microtask queuing
    if (isTestEnvironment()) {
      subscribers.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in subscriber callback (test env):', error);
        }
      });
      return;
    }

    // In browser environments, use microtasks for better component context handling
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => {
        subscribers.forEach((callback) => {
          try {
            callback(data);
          } catch (error) {
            console.error('Error in subscriber callback:', error);
          }
        });
      });
    } else {
      // Fallback for environments without queueMicrotask
      Promise.resolve().then(() => {
        subscribers.forEach((callback) => {
          try {
            callback(data);
          } catch (error) {
            console.error('Error in subscriber callback:', error);
          }
        });
      });
    }
  }

  return {
    subscribe,
    unsubscribe,
    publish,
  };
}