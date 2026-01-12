export const sharedVersions = {
  'react': {version: '*', isEsm: false},
  'react-dom':{version: '*', isEsm: false},
  '@mui/material': {version: '*', isEsm: false},
  '@mui/system': {version: '*', isEsm: false},
  '@mui/styled-engine': {version: '*', isEsm: true},
  '@mui/icons-material': {version: '*', isEsm: false},
   '@emotion/react':{version: '*', isEsm: true},
  '@emotion/styled': {version: '*', isEsm: true},
  '@emotion/cache': {version: '*', isEsm: true} 
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