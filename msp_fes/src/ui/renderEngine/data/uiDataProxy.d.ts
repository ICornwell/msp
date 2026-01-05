import { RePubSub, ReSubscription } from "./ReEnginePubSub";
export type Notes = {
    hasNotes: boolean;
    getNotes?: () => string[];
    setNotes?: (notes: string[]) => void;
    getExpression?: () => string[];
    setExpression?: (expressions: string[]) => void;
};
export declare function getSourceDataProxy(data: any, pubsub: RePubSub): {
    sourceData: any;
    subscriptionHandler: {
        subscribeToPubSub: (subscription: ReSubscription) => string;
        unsubscribeFromPubSub: (subscriberId: string) => void;
        unsubscribeFromAllPubSub: () => void;
    };
    setMetadataMode: (mode: boolean) => void;
};
