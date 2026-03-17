export const sharedVersions = {
  'react': {version: '*', isEsm: false},
  'react-dom':{version: '*', isEsm: false},
  'react-dom/client': {version: '*', isEsm: false},
  'react/jsx-runtime': {version: '*', isEsm: false},
  'react/jsx-dev-runtime': {version: '*', isEsm: false},
  '@azure/msal-browser': {version: '*', isEsm: false},
  '@azure/msal-react': {version: '*', isEsm: false},
  '@emotion/react': {version: '*', isEsm: false},
  '@emotion/styled': {version: '*', isEsm: false},
  '@emotion/cache': {version: '*', isEsm: false},
  '@emotion/react/jsx-runtime': {version: '*', isEsm: false},
  '@mui/styled-engine': {version: '*', isEsm: false},
  '@mui/material': {version: '*', isEsm: false},
  '@mui/system': {version: '*', isEsm: false},
  '@mui/icons-material': {version: '*', isEsm: false},
  'msp_ui_common': {version: '*', isEsm: false},
  'msp_ui_common/uiLib': {version: '*', isEsm: false},
  'msp_ui_common/uiLib/components': {version: '*', isEsm: false},
  'msp_ui_common/uiLib/contexts': {version: '*', isEsm: false}
}

type DependencyInfo = { singleton: boolean; requiredVersion: string | false; isEsm: boolean }
type Dependencies = Record<string, DependencyInfo>

export const sharedDeps: Dependencies = Object.entries(sharedVersions).reduce(
  (deps, [packageName, info]) => {
    deps[packageName] = {
      singleton: true,
      requiredVersion: info.version,
      isEsm: info.isEsm
    }
    return deps
  },
  {} as Dependencies
)

export default sharedDeps

export type { DependencyInfo, Dependencies }