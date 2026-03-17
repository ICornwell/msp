
// Windows temporarily needs this file, https://github.com/module-federation/vite/issues/68

    import {loadShare} from "@module-federation/runtime";
    const importMap = {
      
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
        "@mui/styled-engine": async () => {
          let pkg = await import("__mf__virtual/actorwork__prebuild___mf_0_mui_mf_1_styled_mf_2_engine__prebuild__.js");
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
      