
// Windows temporarily needs this file, https://github.com/module-federation/vite/issues/68

    import {loadShare} from "@module-federation/runtime";
    const importMap = {
      
        "@azure/msal-browser": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild___mf_0_azure_mf_1_msal_mf_2_browser__prebuild__.js");
            return pkg;
        }
      ,
        "@azure/msal-common": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild___mf_0_azure_mf_1_msal_mf_2_common__prebuild__.js");
            return pkg;
        }
      ,
        "@azure/msal-react": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild___mf_0_azure_mf_1_msal_mf_2_react__prebuild__.js");
            return pkg;
        }
      ,
        "@emotion/cache": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild___mf_0_emotion_mf_1_cache__prebuild__.js");
            return pkg;
        }
      ,
        "@emotion/react": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild___mf_0_emotion_mf_1_react__prebuild__.js");
            return pkg;
        }
      ,
        "@emotion/react/jsx-runtime": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild___mf_0_emotion_mf_1_react_mf_1_jsx_mf_2_runtime__prebuild__.js");
            return pkg;
        }
      ,
        "@emotion/styled": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild___mf_0_emotion_mf_1_styled__prebuild__.js");
            return pkg;
        }
      ,
        "@mui/icons-material": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild___mf_0_mui_mf_1_icons_mf_2_material__prebuild__.js");
            return pkg;
        }
      ,
        "@mui/material": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild___mf_0_mui_mf_1_material__prebuild__.js");
            return pkg;
        }
      ,
        "@mui/styled-engine": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild___mf_0_mui_mf_1_styled_mf_2_engine__prebuild__.js");
            return pkg;
        }
      ,
        "@mui/system": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild___mf_0_mui_mf_1_system__prebuild__.js");
            return pkg;
        }
      ,
        "msp_ui_common": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild__msp_ui_common__prebuild__.js");
            return pkg;
        }
      ,
        "msp_ui_common/uiLib": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild__msp_ui_common_mf_1_uiLib__prebuild__.js");
            return pkg;
        }
      ,
        "msp_ui_common/uiLib/behaviours": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild__msp_ui_common_mf_1_uiLib_mf_1_behaviours__prebuild__.js");
            return pkg;
        }
      ,
        "msp_ui_common/uiLib/comms": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild__msp_ui_common_mf_1_uiLib_mf_1_comms__prebuild__.js");
            return pkg;
        }
      ,
        "msp_ui_common/uiLib/components": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild__msp_ui_common_mf_1_uiLib_mf_1_components__prebuild__.js");
            return pkg;
        }
      ,
        "msp_ui_common/uiLib/contexts": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild__msp_ui_common_mf_1_uiLib_mf_1_contexts__prebuild__.js");
            return pkg;
        }
      ,
        "msp_ui_common/uiLib/hooks": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild__msp_ui_common_mf_1_uiLib_mf_1_hooks__prebuild__.js");
            return pkg;
        }
      ,
        "msp_ui_common/uiLib/renderEngine": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild__msp_ui_common_mf_1_uiLib_mf_1_renderEngine__prebuild__.js");
            return pkg;
        }
      ,
        "react": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild__react__prebuild__.js");
            return pkg;
        }
      ,
        "react-dom": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild__react_mf_2_dom__prebuild__.js");
            return pkg;
        }
      ,
        "react-dom/client": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild__react_mf_2_dom_mf_1_client__prebuild__.js");
            return pkg;
        }
      ,
        "react/jsx-dev-runtime": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild__react_mf_1_jsx_mf_2_dev_mf_2_runtime__prebuild__.js");
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
          "@azure/msal-common": {
            name: "@azure/msal-common",
            version: "15.15.0",
            scope: ["default"],
            loaded: false,
            from: "actorwork",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"@azure/msal-common"}' must be provided by host`);
              }
              usedShared["@azure/msal-common"].loaded = true
              const {"@azure/msal-common": pkgDynamicImport} = importMap
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
          "@emotion/cache": {
            name: "@emotion/cache",
            version: "11.14.0",
            scope: ["default"],
            loaded: false,
            from: "actorwork",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"@emotion/cache"}' must be provided by host`);
              }
              usedShared["@emotion/cache"].loaded = true
              const {"@emotion/cache": pkgDynamicImport} = importMap
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
          "@emotion/react": {
            name: "@emotion/react",
            version: "11.14.0",
            scope: ["default"],
            loaded: false,
            from: "actorwork",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"@emotion/react"}' must be provided by host`);
              }
              usedShared["@emotion/react"].loaded = true
              const {"@emotion/react": pkgDynamicImport} = importMap
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
          "@emotion/react/jsx-runtime": {
            name: "@emotion/react/jsx-runtime",
            version: "11.14.0",
            scope: ["default"],
            loaded: false,
            from: "actorwork",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"@emotion/react/jsx-runtime"}' must be provided by host`);
              }
              usedShared["@emotion/react/jsx-runtime"].loaded = true
              const {"@emotion/react/jsx-runtime": pkgDynamicImport} = importMap
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
          "@emotion/styled": {
            name: "@emotion/styled",
            version: "11.14.1",
            scope: ["default"],
            loaded: false,
            from: "actorwork",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"@emotion/styled"}' must be provided by host`);
              }
              usedShared["@emotion/styled"].loaded = true
              const {"@emotion/styled": pkgDynamicImport} = importMap
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
          "@mui/icons-material": {
            name: "@mui/icons-material",
            version: "7.3.9",
            scope: ["default"],
            loaded: false,
            from: "actorwork",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"@mui/icons-material"}' must be provided by host`);
              }
              usedShared["@mui/icons-material"].loaded = true
              const {"@mui/icons-material": pkgDynamicImport} = importMap
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
          "@mui/material": {
            name: "@mui/material",
            version: "7.3.9",
            scope: ["default"],
            loaded: false,
            from: "actorwork",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"@mui/material"}' must be provided by host`);
              }
              usedShared["@mui/material"].loaded = true
              const {"@mui/material": pkgDynamicImport} = importMap
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
          "@mui/styled-engine": {
            name: "@mui/styled-engine",
            version: "7.3.9",
            scope: ["default"],
            loaded: false,
            from: "actorwork",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"@mui/styled-engine"}' must be provided by host`);
              }
              usedShared["@mui/styled-engine"].loaded = true
              const {"@mui/styled-engine": pkgDynamicImport} = importMap
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
          "@mui/system": {
            name: "@mui/system",
            version: "7.3.9",
            scope: ["default"],
            loaded: false,
            from: "actorwork",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"@mui/system"}' must be provided by host`);
              }
              usedShared["@mui/system"].loaded = true
              const {"@mui/system": pkgDynamicImport} = importMap
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
            from: "actorwork",
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
          "msp_ui_common/uiLib/behaviours": {
            name: "msp_ui_common/uiLib/behaviours",
            version: "0.0.0",
            scope: ["default"],
            loaded: false,
            from: "actorwork",
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
            from: "actorwork",
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
            from: "actorwork",
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
            from: "actorwork",
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
            from: "actorwork",
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
          "msp_ui_common/uiLib/renderEngine": {
            name: "msp_ui_common/uiLib/renderEngine",
            version: "0.0.0",
            scope: ["default"],
            loaded: false,
            from: "actorwork",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"msp_ui_common/uiLib/renderEngine"}' must be provided by host`);
              }
              usedShared["msp_ui_common/uiLib/renderEngine"].loaded = true
              const {"msp_ui_common/uiLib/renderEngine": pkgDynamicImport} = importMap
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
          "react-dom": {
            name: "react-dom",
            version: "19.2.4",
            scope: ["default"],
            loaded: false,
            from: "actorwork",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"react-dom"}' must be provided by host`);
              }
              usedShared["react-dom"].loaded = true
              const {"react-dom": pkgDynamicImport} = importMap
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
          "react/jsx-dev-runtime": {
            name: "react/jsx-dev-runtime",
            version: "19.2.4",
            scope: ["default"],
            loaded: false,
            from: "actorwork",
            async get () {
              if (false) {
                throw new Error(`Shared module '${"react/jsx-dev-runtime"}' must be provided by host`);
              }
              usedShared["react/jsx-dev-runtime"].loaded = true
              const {"react/jsx-dev-runtime": pkgDynamicImport} = importMap
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
      