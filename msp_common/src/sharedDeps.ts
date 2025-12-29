export const sharedVersions = {
  'react': '*',
  'react-dom': '*',
  'react-router': '*',
  '@mui/material': '*',
  '@mui/icons-material': '*',
  '@emotion/react': '*',
  '@emotion/styled': '*',
  '@emotion/styled-base': '*',
  '@emotion/cache': '*'
}

type DependencyInfo = { singleton: boolean; requiredVersion: string | false }
type Dependencies = Record<string, DependencyInfo>

export const sharedDeps: Dependencies = Object.entries(sharedVersions).reduce(
  (deps, [packageName, version]) => {
    deps[packageName] = {
      singleton: true,
      requiredVersion: version
    }
    return deps
  },
  {} as Dependencies
)

export default sharedDeps

export type { DependencyInfo, Dependencies }