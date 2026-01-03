const remoteEntryPromise = import("../remoteEntry.js");
Promise.resolve(remoteEntryPromise).then((remoteEntry) => {
  return Promise.resolve(remoteEntry.__tla).then(remoteEntry.init).catch(remoteEntry.init);
});
//# sourceMappingURL=hostInit-DSml_viB.js.map
