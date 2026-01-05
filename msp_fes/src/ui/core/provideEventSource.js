export default function provideEventSource(subscribers) {
    return function (message) {
        subscribers.forEach((callback) => {
            callback(message);
        });
    };
}
//# sourceMappingURL=provideEventSource.js.map