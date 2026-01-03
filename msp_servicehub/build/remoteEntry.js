import { i as init_1 } from "./assets/index.cjs-TYu3tD0Q.js";
import exposesMap from "./assets/virtualExposes-d-k4RvEE.js";
import { initResolve } from "__mf__virtual/remote__mf_v__runtimeInit__mf_v__.js";
import "@module-federation/runtime-core";
import "@module-federation/error-codes";
const importMap = {
  "react": async () => {
    let pkg = await import("react");
    return pkg;
  },
  "react-dom": async () => {
    let pkg = await import("react-dom");
    return pkg;
  }
};
const usedShared = {
  "react": {
    name: "react",
    version: "19.1.0",
    scope: ["default"],
    loaded: false,
    from: "remote",
    async get() {
      usedShared["react"].loaded = true;
      const { "react": pkgDynamicImport } = importMap;
      const res = await pkgDynamicImport();
      const exportModule = { ...res };
      return function() {
        if (!exportModule.default) {
          return exportModule;
        } else {
          const mod = exportModule.default;
          Object.assign(mod, exportModule);
          delete exportModule.default;
          return mod;
        }
      };
    },
    shareConfig: {
      singleton: true,
      requiredVersion: "*"
    }
  },
  "react-dom": {
    name: "react-dom",
    version: "19.1.0",
    scope: ["default"],
    loaded: false,
    from: "remote",
    async get() {
      usedShared["react-dom"].loaded = true;
      const { "react-dom": pkgDynamicImport } = importMap;
      const res = await pkgDynamicImport();
      const exportModule = { ...res };
      return function() {
        if (!exportModule.default) {
          return exportModule;
        } else {
          const mod = exportModule.default;
          Object.assign(mod, exportModule);
          delete exportModule.default;
          return mod;
        }
      };
    },
    shareConfig: {
      singleton: true,
      requiredVersion: "*"
    }
  }
};
const usedRemotes = [];
const initTokens = {};
const shareScopeName = "default";
const mfName = "remote";
async function init(shared = {}, initScope = []) {
  const initRes = init_1({
    name: mfName,
    remotes: usedRemotes,
    shared: usedShared,
    plugins: [],
    shareStrategy: "version-first"
  });
  var initToken = initTokens[shareScopeName];
  if (!initToken)
    initToken = initTokens[shareScopeName] = { from: mfName };
  if (initScope.indexOf(initToken) >= 0) return;
  initScope.push(initToken);
  initRes.initShareScopeMap("default", shared);
  try {
    await Promise.all(await initRes.initializeSharing("default", {
      strategy: "version-first",
      from: "build",
      initScope
    }));
  } catch (e) {
    console.error(e);
  }
  initResolve(initRes);
  return initRes;
}
function getExposes(moduleName) {
  if (!(moduleName in exposesMap)) throw new Error(`Module ${moduleName} does not exist in container.`);
  return exposesMap[moduleName]().then((res) => () => res);
}
export {
  getExposes as get,
  init
};
//# sourceMappingURL=remoteEntry.js.map
