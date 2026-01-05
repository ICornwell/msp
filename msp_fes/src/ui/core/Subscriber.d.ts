export interface Subscriber {
    subscriber: (SubscriberId: string, callback: Function) => void;
    unsubscribe: (SubscriberId: string) => void;
}
export interface Pubisher<E> {
    publish: (data: E) => void;
}
