
// Windows temporarily needs this file, https://github.com/module-federation/vite/issues/68

    import {loadShare} from "@module-federation/runtime";
    const importMap = {
      
        "react": async () => {
          let pkg = await import("__mf__virtual/lloydsMsg__prebuild__react__prebuild__.js");
            return pkg;
        }
      ,
        "react-dom/client": async () => {
          let pkg = await import("__mf__virtual/lloydsMsg__prebuild__react_mf_2_dom_mf_1_client__prebuild__.js");
            return pkg;
        }
      ,
        "react/jsx-runtime": async () => {
          let pkg = await import("__mf__virtual/lloydsMsg__prebuild__react_mf_1_jsx_mf_2_runtime__prebuild__.js");
            return pkg;
        }
      
    }
      const usedShared = {
      
          "react": {
            name: "react",
            version: "19.2.7",
            scope: ["default"],
            loaded: false,
            from: "lloydsMsg",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"react"}' must be provided by host`);
              }
              usedShared["react"].loaded = true
              const {"react": pkgDynamicImport} = importMap
              const res = await pkgDynamicImport()
              const exportModule = {...res}
              // All npm packages pre-built by vite will be converted to esm
              // removed code below
              // Object.defineProperty(exportModule, "__esModule", {
              //   value: true,
              //   enumerable: false
              // })
              return function () {
                if (!exportModule.default) {
                  return exportModule
                } else {
                  const mod = exportModule.default;
                  if (typeof mod === 'function') {
                    try {
                      return Object.assign(mod, exportModule);
                    } catch (_error) {
                      return mod;
                    }
                  }

                  if (typeof mod === 'object' && mod !== null) {
                    // ESM namespace objects can be non-extensible. Build a merged
                    // plain object instead of mutating module/default objects.
                    return {
                      ...exportModule,
                      ...mod,
                      default: mod,
                    };
                  }

                  return exportModule;
                }
              }
            },
            shareConfig: {
              singleton: true,
              requiredVersion: "*",
              
            }
          }
        ,
          "react-dom/client": {
            name: "react-dom/client",
            version: "19.2.7",
            scope: ["default"],
            loaded: false,
            from: "lloydsMsg",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"react-dom/client"}' must be provided by host`);
              }
              usedShared["react-dom/client"].loaded = true
              const {"react-dom/client": pkgDynamicImport} = importMap
              const res = await pkgDynamicImport()
              const exportModule = {...res}
              // All npm packages pre-built by vite will be converted to esm
              // removed code below
              // Object.defineProperty(exportModule, "__esModule", {
              //   value: true,
              //   enumerable: false
              // })
              return function () {
                if (!exportModule.default) {
                  return exportModule
                } else {
                  const mod = exportModule.default;
                  if (typeof mod === 'function') {
                    try {
                      return Object.assign(mod, exportModule);
                    } catch (_error) {
                      return mod;
                    }
                  }

                  if (typeof mod === 'object' && mod !== null) {
                    // ESM namespace objects can be non-extensible. Build a merged
                    // plain object instead of mutating module/default objects.
                    return {
                      ...exportModule,
                      ...mod,
                      default: mod,
                    };
                  }

                  return exportModule;
                }
              }
            },
            shareConfig: {
              singleton: true,
              requiredVersion: "*",
              
            }
          }
        ,
          "react/jsx-runtime": {
            name: "react/jsx-runtime",
            version: "19.2.7",
            scope: ["default"],
            loaded: false,
            from: "lloydsMsg",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"react/jsx-runtime"}' must be provided by host`);
              }
              usedShared["react/jsx-runtime"].loaded = true
              const {"react/jsx-runtime": pkgDynamicImport} = importMap
              const res = await pkgDynamicImport()
              const exportModule = {...res}
              // All npm packages pre-built by vite will be converted to esm
              // removed code below
              // Object.defineProperty(exportModule, "__esModule", {
              //   value: true,
              //   enumerable: false
              // })
              return function () {
                if (!exportModule.default) {
                  return exportModule
                } else {
                  const mod = exportModule.default;
                  if (typeof mod === 'function') {
                    try {
                      return Object.assign(mod, exportModule);
                    } catch (_error) {
                      return mod;
                    }
                  }

                  if (typeof mod === 'object' && mod !== null) {
                    // ESM namespace objects can be non-extensible. Build a merged
                    // plain object instead of mutating module/default objects.
                    return {
                      ...exportModule,
                      ...mod,
                      default: mod,
                    };
                  }

                  return exportModule;
                }
              }
            },
            shareConfig: {
              singleton: true,
              requiredVersion: "*",
              
            }
          }
        
    }
      const usedRemotes = [
      ]
      export {
        usedShared,
        usedRemotes
      }
      