import { useEffect, useState, useRef, memo } from 'react';
import { loadRemote, registerRemotes } from '@module-federation/runtime';
import { Remote } from "@module-federation/runtime/types";

import type { UiFeatureManifestSection } from "msp_common";
import { getAvailableFeatures } from "msp_ui_common/uiLib/comms";
import * as uiLibNs from "msp_ui_common/uiLib";
// import type { UserChangeHandler } from 'msp_ui_common/uiLib/hooks';
import { UiRemoteRegistration } from 'msp_common';

type UiLibModule = typeof uiLibNs;
type UiLibModuleWithDefault = UiLibModule & { default?: UiLibModule };

const uiLib: UiLibModule = (uiLibNs as UiLibModuleWithDefault).default ?? uiLibNs;
const { useUserSession } = uiLib;

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
  const componentRef = useRef<React.FC<any>[]>([]);

  const userChangeHAndler = useUserSession()

  userChangeHAndler.onLoggedIn = (userId: string) => {
    console.log(`User logged in: ${userId}`);
    setCurrentUser(userId);
  }

  userChangeHAndler.onLoggedOut = (userId: string) => {
    console.log(`User logged out: ${userId}`);
    setCurrentUser(null);
  }

  useEffect(() => {
    let cancelled = false;

    async function discoverAndLoadFeatures() {
      try {
        const remotes = await getAvailableFeatures<UiRemoteRegistration>('discoverOpenUiFeatures', {
          product: context.product,
        }) as UiRemoteRegistration[];
        console.log('Discovered UI Features:', remotes);


        if (remotes.length > 0) {
          registerRemotes(remotes.map((remote) => ({
            type: 'module',
            name: remote.remoteName,
            entry: `${window.location.origin}/ui/v1/${remote.remoteFileName}?__msp_mf_route=${encodeURIComponent(remote.remoteFileName)}`,
          } as Remote)));
        }

        const loadedComponents: React.FC<any>[] = [];
        for (const remote of remotes) {
          try {
            const module: any = await loadRemote(`${remote.remoteName}/${remote.moduleName}`);
            if (module?.default) {
              loadedComponents.push(module.default as React.FC<any>);
            }
          } catch (error) {
            console.error(`Error loading remote module ${remote.moduleName} @ ${remote.remoteEntry}:`, error);
          }
        }

        if (!cancelled) {
          componentRef.current = loadedComponents;
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
    {loaded && componentRef.current.map((Component, index) => {
      const MemoComponent = memo(Component);
      return (
        <MemoComponent key={index} />
      );
    }
    )}
  </>)
}

export default AppUiFeatures;