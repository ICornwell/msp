export default function PubSub() {
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
      subscribers.forEach((callback) => {
        callback(data);
      });
  }

  return {
    subscribe,
    unsubscribe,
    publish,
  };
}