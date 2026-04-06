
// Windows temporarily needs this file, https://github.com/module-federation/vite/issues/68

    import {loadShare} from "@module-federation/runtime";
    const importMap = {
      
        "@azure/msal-browser": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild___mf_0_azure_mf_1_msal_mf_2_browser__prebuild__.js");
            return pkg;
        }
      ,
        "@azure/msal-react": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild___mf_0_azure_mf_1_msal_mf_2_react__prebuild__.js");
            return pkg;
        }
      ,
        "msp_ui_common/uiLib": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild__msp_ui_common_mf_1_uiLib__prebuild__.js");
            return pkg;
        }
      ,
        "react": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild__react__prebuild__.js");
            return pkg;
        }
      ,
        "react-dom/client": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild__react_mf_2_dom_mf_1_client__prebuild__.js");
            return pkg;
        }
      ,
        "react/jsx-runtime": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild__react_mf_1_jsx_mf_2_runtime__prebuild__.js");
            return pkg;
        }
      
    }
      const usedShared = {
      
          "@azure/msal-browser": {
            name: "@azure/msal-browser",
            version: "4.29.0",
            scope: ["default"],
            loaded: false,
            from: "actorwork",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"@azure/msal-browser"}' must be provided by host`);
              }
              usedShared["@azure/msal-browser"].loaded = true
              const {"@azure/msal-browser": pkgDynamicImport} = importMap
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
          "@azure/msal-react": {
            name: "@azure/msal-react",
            version: "3.0.27",
            scope: ["default"],
            loaded: false,
            from: "actorwork",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"@azure/msal-react"}' must be provided by host`);
              }
              usedShared["@azure/msal-react"].loaded = true
              const {"@azure/msal-react": pkgDynamicImport} = importMap
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
          "msp_ui_common/uiLib": {
            name: "msp_ui_common/uiLib",
            version: "0.0.0",
            scope: ["default"],
            loaded: false,
            from: "actorwork",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"msp_ui_common/uiLib"}' must be provided by host`);
              }
              usedShared["msp_ui_common/uiLib"].loaded = true
              const {"msp_ui_common/uiLib": pkgDynamicImport} = importMap
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
          "react": {
            name: "react",
            version: "19.2.4",
            scope: ["default"],
            loaded: false,
            from: "actorwork",
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
            version: "19.2.4",
            scope: ["default"],
            loaded: false,
            from: "actorwork",
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
            version: "19.2.4",
            scope: ["default"],
            loaded: false,
            from: "actorwork",
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
      