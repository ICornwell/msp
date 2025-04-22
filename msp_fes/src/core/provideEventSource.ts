export default function provideEventSource<M>(subscribers: Map<string, ((msg: M)=> void)>) {
    return function(message: M) {
            subscribers.forEach((callback) => {
                callback(message);
              });
    };
}