
// Windows temporarily needs this file, https://github.com/module-federation/vite/issues/68

    import {loadShare} from "@module-federation/runtime";
    const importMap = {
      
        "@emotion/cache": async () => {
          let pkg = await import("__mf__virtual/host__prebuild___mf_0_emotion_mf_1_cache__prebuild__.js");
            return pkg;
        }
      ,
        "@emotion/react": async () => {
          let pkg = await import("__mf__virtual/host__prebuild___mf_0_emotion_mf_1_react__prebuild__.js");
            return pkg;
        }
      ,
        "@emotion/styled": async () => {
          let pkg = await import("__mf__virtual/host__prebuild___mf_0_emotion_mf_1_styled__prebuild__.js");
            return pkg;
        }
      ,
        "@mui/icons-material": async () => {
          let pkg = await import("__mf__virtual/host__prebuild___mf_0_mui_mf_1_icons_mf_2_material__prebuild__.js");
            return pkg;
        }
      ,
        "@mui/material": async () => {
          let pkg = await import("__mf__virtual/host__prebuild___mf_0_mui_mf_1_material__prebuild__.js");
            return pkg;
        }
      ,
        "@mui/styled-engine": async () => {
          let pkg = await import("__mf__virtual/host__prebuild___mf_0_mui_mf_1_styled_mf_2_engine__prebuild__.js");
            return pkg;
        }
      ,
        "@mui/system": async () => {
          let pkg = await import("__mf__virtual/host__prebuild___mf_0_mui_mf_1_system__prebuild__.js");
            return pkg;
        }
      ,
        "react": async () => {
          let pkg = await import("__mf__virtual/host__prebuild__react__prebuild__.js");
            return pkg;
        }
      ,
        "react-dom": async () => {
          let pkg = await import("__mf__virtual/host__prebuild__react_mf_2_dom__prebuild__.js");
            return pkg;
        }
      
    }
      const usedShared = {
      
          "@emotion/cache": {
            name: "@emotion/cache",
            version: "11.14.0",
            scope: ["default"],
            loaded: false,
            from: "host",
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
                  Object.assign(mod, exportModule);
                  delete mod.default;
                  return mod;
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
            from: "host",
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
                  Object.assign(mod, exportModule);
                  delete mod.default;
                  return mod;
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
            from: "host",
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
                  Object.assign(mod, exportModule);
                  delete mod.default;
                  return mod;
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
            version: "7.3.6",
            scope: ["default"],
            loaded: false,
            from: "host",
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
                  Object.assign(mod, exportModule);
                  delete mod.default;
                  return mod;
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
            version: "7.3.6",
            scope: ["default"],
            loaded: false,
            from: "host",
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
                  Object.assign(mod, exportModule);
                  delete mod.default;
                  return mod;
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
            version: "7.3.6",
            scope: ["default"],
            loaded: false,
            from: "host",
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
                  Object.assign(mod, exportModule);
                  delete mod.default;
                  return mod;
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
            version: "7.3.6",
            scope: ["default"],
            loaded: false,
            from: "host",
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
                  Object.assign(mod, exportModule);
                  delete mod.default;
                  return mod;
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
            version: "19.2.3",
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
                  Object.assign(mod, exportModule);
                  delete mod.default;
                  return mod;
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
            version: "19.2.3",
            scope: ["default"],
            loaded: false,
            from: "host",
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
                  Object.assign(mod, exportModule);
                  delete mod.default;
                  return mod;
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
      