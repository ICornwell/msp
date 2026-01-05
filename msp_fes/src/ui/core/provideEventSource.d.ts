export default function provideEventSource<M>(subscribers: Map<string, ((msg: M) => void)>): (message: M) => void;
