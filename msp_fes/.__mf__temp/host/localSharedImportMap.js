
// Windows temporarily needs this file, https://github.com/module-federation/vite/issues/68

    import {loadShare} from "@module-federation/runtime";
    const importMap = {
      
        "@azure/msal-browser": async () => {
          let pkg = await import("__mf__virtual/host__prebuild___mf_0_azure_mf_1_msal_mf_2_browser__prebuild__.js");
            return pkg;
        }
      ,
        "@azure/msal-react": async () => {
          let pkg = await import("__mf__virtual/host__prebuild___mf_0_azure_mf_1_msal_mf_2_react__prebuild__.js");
            return pkg;
        }
      ,
        "msp_ui_common": async () => {
          let pkg = await import("__mf__virtual/host__prebuild__msp_ui_common__prebuild__.js");
            return pkg;
        }
      ,
        "msp_ui_common/uiLib/behaviours": async () => {
          let pkg = await import("__mf__virtual/host__prebuild__msp_ui_common_mf_1_uiLib_mf_1_behaviours__prebuild__.js");
            return pkg;
        }
      ,
        "msp_ui_common/uiLib/comms": async () => {
          let pkg = await import("__mf__virtual/host__prebuild__msp_ui_common_mf_1_uiLib_mf_1_comms__prebuild__.js");
            return pkg;
        }
      ,
        "msp_ui_common/uiLib/components": async () => {
          let pkg = await import("__mf__virtual/host__prebuild__msp_ui_common_mf_1_uiLib_mf_1_components__prebuild__.js");
            return pkg;
        }
      ,
        "msp_ui_common/uiLib/contexts": async () => {
          let pkg = await import("__mf__virtual/host__prebuild__msp_ui_common_mf_1_uiLib_mf_1_contexts__prebuild__.js");
            return pkg;
        }
      ,
        "msp_ui_common/uiLib/hooks": async () => {
          let pkg = await import("__mf__virtual/host__prebuild__msp_ui_common_mf_1_uiLib_mf_1_hooks__prebuild__.js");
            return pkg;
        }
      ,
        "react": async () => {
          let pkg = await import("__mf__virtual/host__prebuild__react__prebuild__.js");
            return pkg;
        }
      ,
        "react-dom/client": async () => {
          let pkg = await import("__mf__virtual/host__prebuild__react_mf_2_dom_mf_1_client__prebuild__.js");
            return pkg;
        }
      ,
        "react/jsx-runtime": async () => {
          let pkg = await import("__mf__virtual/host__prebuild__react_mf_1_jsx_mf_2_runtime__prebuild__.js");
            return pkg;
        }
      
    }
      const usedShared = {
      
          "@azure/msal-browser": {
            name: "@azure/msal-browser",
            version: "4.29.0",
            scope: ["default"],
            loaded: false,
            from: "host",
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
            from: "host",
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
          "msp_ui_common": {
            name: "msp_ui_common",
            version: "0.0.0",
            scope: ["default"],
            loaded: false,
            from: "host",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"msp_ui_common"}' must be provided by host`);
              }
              usedShared["msp_ui_common"].loaded = true
              const {"msp_ui_common": pkgDynamicImport} = importMap
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
          "msp_ui_common/uiLib/behaviours": {
            name: "msp_ui_common/uiLib/behaviours",
            version: "0.0.0",
            scope: ["default"],
            loaded: false,
            from: "host",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"msp_ui_common/uiLib/behaviours"}' must be provided by host`);
              }
              usedShared["msp_ui_common/uiLib/behaviours"].loaded = true
              const {"msp_ui_common/uiLib/behaviours": pkgDynamicImport} = importMap
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
          "msp_ui_common/uiLib/comms": {
            name: "msp_ui_common/uiLib/comms",
            version: "0.0.0",
            scope: ["default"],
            loaded: false,
            from: "host",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"msp_ui_common/uiLib/comms"}' must be provided by host`);
              }
              usedShared["msp_ui_common/uiLib/comms"].loaded = true
              const {"msp_ui_common/uiLib/comms": pkgDynamicImport} = importMap
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
          "msp_ui_common/uiLib/components": {
            name: "msp_ui_common/uiLib/components",
            version: "0.0.0",
            scope: ["default"],
            loaded: false,
            from: "host",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"msp_ui_common/uiLib/components"}' must be provided by host`);
              }
              usedShared["msp_ui_common/uiLib/components"].loaded = true
              const {"msp_ui_common/uiLib/components": pkgDynamicImport} = importMap
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
          "msp_ui_common/uiLib/contexts": {
            name: "msp_ui_common/uiLib/contexts",
            version: "0.0.0",
            scope: ["default"],
            loaded: false,
            from: "host",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"msp_ui_common/uiLib/contexts"}' must be provided by host`);
              }
              usedShared["msp_ui_common/uiLib/contexts"].loaded = true
              const {"msp_ui_common/uiLib/contexts": pkgDynamicImport} = importMap
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
          "msp_ui_common/uiLib/hooks": {
            name: "msp_ui_common/uiLib/hooks",
            version: "0.0.0",
            scope: ["default"],
            loaded: false,
            from: "host",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"msp_ui_common/uiLib/hooks"}' must be provided by host`);
              }
              usedShared["msp_ui_common/uiLib/hooks"].loaded = true
              const {"msp_ui_common/uiLib/hooks": pkgDynamicImport} = importMap
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
            from: "host",
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
            from: "host",
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
            from: "host",
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
      