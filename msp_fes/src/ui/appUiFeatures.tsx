import { useEffect, useState, useRef, memo } from 'react';
import { loadRemote, registerRemotes } from '@module-federation/runtime';
import { Remote } from "@module-federation/runtime/types";
import type { UiFeatureManifestSection } from "msp_svr_common";
import { getAvailableFeatures } from "msp_ui_common/uiLib/comms";
import { useUserSession } from "msp_ui_common/uiLib/hooks";
import { UiRemoteRegistration } from 'msp_common';
import { Behaviour, behaviourConfig } from 'msp_ui_common';

type DiscoveryUiFeature = UiFeatureManifestSection & {
  serverUrl?: string;
  remotePath: string;
};

const context = {
  product: {
    domain: '*',
    name: '*',
    version: '*',
    variantName: '*'
  }
}

export function AppUiFeatures() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [ redrawToggle, setRedrawToggle ] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const behaviourConfigRef = useRef<behaviourConfig[]>([]);

  const onLoggedIn = (sessionInfo) => {
    console.log(`User logged in: ${sessionInfo.userId}`);
    setCurrentUser(sessionInfo.userId);
  }

  const onLoggedOut = (sessionInfo) => {
    console.log(`User logged out: ${sessionInfo.userId}`);
    setCurrentUser(null);
  }

   useUserSession({ onLoggedIn, onLoggedOut });

  useEffect(() => {
    let cancelled = false;

    async function discoverAndLoadFeatures() {
      try {
        setLoaded(false);
        const remotes = await getAvailableFeatures<UiRemoteRegistration>('discoverOpenUiFeatures', {
          product: context.product,
        }) as UiRemoteRegistration[];
        console.log('Discovered UI Features:', remotes);

        const serverOriginParts = window.location.origin.split(':');
        const serverBase = `${serverOriginParts[0]}:${serverOriginParts[1]}`
        const serverPort = serverOriginParts.length > 2 ? `:${serverOriginParts[2]}` : '';
        if (remotes.length > 0) {
          registerRemotes(remotes.map((remote) => {
            const safeRemoteName = encodeURIComponent(remote.remoteName);
            const safeRemoteFileName = encodeURIComponent(remote.remoteFileName);
            return {
              type: 'module',
              name: safeRemoteName,
              entry: `${serverBase}_${safeRemoteName}${serverPort}/${safeRemoteFileName}`,
            } as Remote;
          }));
        }

        const loadedConfigs: behaviourConfig[] = [];
        for (const remote of remotes) {
          try {
            const module: any = await loadRemote(`${remote.remoteName}/${remote.moduleName}`);
            if (module?.default) {
              const resolvedConfigs = module.default()
              const configs = Array.isArray(resolvedConfigs) ? resolvedConfigs : [resolvedConfigs];
              // Stamp the authoritative scope identity from service discovery onto every config
              // returned by this remote. Module authors do not self-declare their identity.
              loadedConfigs.push(...configs.map((config: behaviourConfig) => ({
                ...config,
                scopeId: remote.scope ?? config.scopeId,
                name: `${remote.remoteName}/${remote.moduleName}`,
              })));
            }
          } catch (error) {
            console.error(`Error loading remote module ${remote.moduleName} @ ${remote.remoteEntry}:`, error);
          }
        }

        if (!cancelled) {
          console.log(`Loaded UI feature configs: ${loadedConfigs.length} for ${currentUser}, was ${behaviourConfigRef.current.length} before`);
      //    if (behaviourConfigRef.current.length != loadedConfigs.length) {
            behaviourConfigRef.current = loadedConfigs;
            setLoaded(true);
     //     }
     //     setRedrawToggle((prev) => !prev); // Force a re-render to display the loaded features
          
        }
      } catch (error) {
        console.error('Error discovering UI features:', error);
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    discoverAndLoadFeatures();

    return () => {
      cancelled = true;
    };
  }, [currentUser, (behaviourConfigRef.current.length == 0)]); // Re-run when the current user changes or the number of loaded configs changes

  console.log(`Rendering AppUiFeatures for user: ${currentUser}, loaded: ${loaded}, redrawToggle: ${redrawToggle}, behaviourConfig length: ${behaviourConfigRef.current.length}`);

  if (!loaded) {
    return null;
  }

  return (<>
    {loaded && behaviourConfigRef.current.map((behaviourConfig, index) => {
      return (
        <Behaviour name={behaviourConfig.name} config={behaviourConfig} key={`fc_${index}`} />
      );
     
    }
    )}
  </>)
}

export default AppUiFeatures;