const exposesMap = {
  "AppCore": async () => {
    const importModule = await import("./appCore-BpwD_EZB.js");
    const exportModule = {};
    Object.assign(exportModule, importModule);
    Object.defineProperty(exportModule, "__esModule", {
      value: true,
      enumerable: false
    });
    return exportModule;
  }
};
export {
  exposesMap as default
};
//# sourceMappingURL=virtualExposes-d-k4RvEE.js.map
