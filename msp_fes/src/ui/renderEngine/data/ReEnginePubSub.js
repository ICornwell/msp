import { v4 } from 'uuid';
export default function PubSub() {
    const subscribers = new Map();
    function subscribe(subscription) {
        const subscriberId = v4();
        const { callback, msgTypeFilter } = subscription;
        subscribers.set(subscriberId, { callback, msgTypeFilter });
        return subscriberId;
    }
    function unsubscribe(subscriberId) {
        const subscriberIdSubscribers = subscribers.get(subscriberId);
        if (subscriberIdSubscribers) {
            subscribers.delete(subscriberId);
        }
    }
    function publish(msg) {
        subscribers.forEach(({ callback, msgTypeFilter }) => {
            try {
                if (!msgTypeFilter || msgTypeFilter(msg))
                    callback(msg);
            }
            catch (error) {
                console.error('Error in subscriber callback:', error);
            }
        });
    }
    return {
        subscribe,
        unsubscribe,
        publish,
    };
}
//# sourceMappingURL=ReEnginePubSub.js.map