import require$$0 from "@module-federation/runtime-core";
import "@module-federation/error-codes";
var utils_cjs = {};
var runtimeCore$1 = require$$0;
function getBuilderId() {
  return typeof FEDERATION_BUILD_IDENTIFIER !== "undefined" ? FEDERATION_BUILD_IDENTIFIER : "";
}
function getGlobalFederationInstance(name, version) {
  const buildId = getBuilderId();
  return runtimeCore$1.CurrentGlobal.__FEDERATION__.__INSTANCES__.find((GMInstance) => {
    if (buildId && GMInstance.options.id === buildId) {
      return true;
    }
    if (GMInstance.options.name === name && !GMInstance.options.version && !version) {
      return true;
    }
    if (GMInstance.options.name === name && version && GMInstance.options.version === version) {
      return true;
    }
    return false;
  });
}
utils_cjs.getGlobalFederationInstance = getGlobalFederationInstance;
var runtimeCore = require$$0;
var utils = utils_cjs;
function createInstance(options) {
  const ModuleFederationConstructor = runtimeCore.getGlobalFederationConstructor() || runtimeCore.ModuleFederation;
  const instance = new ModuleFederationConstructor(options);
  runtimeCore.setGlobalFederationInstance(instance);
  return instance;
}
let FederationInstance = null;
function init(options) {
  const instance = utils.getGlobalFederationInstance(options.name, options.version);
  if (!instance) {
    FederationInstance = createInstance(options);
    return FederationInstance;
  } else {
    instance.initOptions(options);
    if (!FederationInstance) {
      FederationInstance = instance;
    }
    return instance;
  }
}
runtimeCore.setGlobalFederationConstructor(runtimeCore.ModuleFederation);
runtimeCore.Module;
runtimeCore.ModuleFederation;
runtimeCore.getRemoteEntry;
runtimeCore.getRemoteInfo;
runtimeCore.loadScript;
runtimeCore.loadScriptNode;
runtimeCore.registerGlobalPlugins;
var init_1 = init;
export {
  init_1 as i
};
//# sourceMappingURL=index.cjs-TYu3tD0Q.js.map
