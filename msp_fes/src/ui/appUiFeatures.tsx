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
              loadedConfigs.push((module.default as () => behaviourConfig)());
            }
          } catch (error) {
            console.error(`Error loading remote module ${remote.moduleName} @ ${remote.remoteEntry}:`, error);
          }
        }

        if (!cancelled) {
          behaviourConfigRef.current = loadedConfigs;
          setLoaded(true);
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
  }, [currentUser]);
  return (<>
    {loaded && behaviourConfigRef.current.map((behaviourConfig, index) => {
      return (
        <Behaviour config={behaviourConfig} key={`fc_${index}_${currentUser}`} />
      );
     
    }
    )}
  </>)
}

export default AppUiFeatures;