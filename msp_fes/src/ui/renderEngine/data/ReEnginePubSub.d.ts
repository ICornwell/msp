import { ReSubscriptionHandler } from '../components/RePubSubHook';
import { Notes } from './uiDataProxy';
export type RePubSub = {
    subscribe: (subscription: ReSubscription) => string;
    unsubscribe: (subscriberId: string) => void;
    publish: (msg: RePubSubMsg) => void;
};
export type RePubSubMsg = {
    messageType: string;
    recordSubscriberId: string;
    path: string;
    propertyKey: string | number | symbol;
    newValue: any;
    oldValue: any;
    subscriptionHandler: ReSubscriptionHandler;
    setter: (newValue: any) => void;
    notes?: Notes;
};
export type ReSubscription = {
    callback: (msg: RePubSubMsg) => void;
    msgTypeFilter?: (msg: RePubSubMsg) => boolean;
};
export default function PubSub(): RePubSub;
