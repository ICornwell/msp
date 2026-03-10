import { useEffect, useState, useRef, memo } from 'react';
import { loadRemote, registerRemotes } from '@module-federation/runtime';
import { Remote } from "@module-federation/runtime/types";

import type { UiFeatureManifestSection } from "msp_common";
import { getAvailableFeatures } from "msp_ui_common/uiLib/comms";

type DiscoveryUiFeature = UiFeatureManifestSection & {
  serverUrl?: string;
  remotePath: string;
};

function toRemoteDescriptor(feature: DiscoveryUiFeature): { remoteName: string; modulePath: string; entry: string } | null {
  if (!feature.remotePath) {
    return null;
  }

  const [remoteName, moduleName] = feature.remotePath.split('/');
  if (!remoteName) {
    return null;
  }

  const modulePath = moduleName ? `./${moduleName}` : './AppCore';
  const baseUrl = (feature.serverUrl || '').replace(/\/$/, '');
  const entry = baseUrl
    ? `${baseUrl}/${remoteName}_remoteEntry.js`
    : `${window.location.origin}/ui/v1/${remoteName}_remoteEntry.js`;

  return { remoteName, modulePath, entry };
}

export function AppUiFeatures() {
  const [loaded, setLoaded] = useState(false);
  const componentRef = useRef<React.FC<any>[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function discoverAndLoadFeatures() {
      try {
        const features = await getAvailableFeatures() as DiscoveryUiFeature[];
        console.log('Discovered UI Features:', features);

        const descriptors = features
          .map(toRemoteDescriptor)
          .filter((value): value is { remoteName: string; modulePath: string; entry: string } => value !== null);

        const uniqueRemotes = Array.from(new Map(
          descriptors.map((d) => [d.remoteName, d])
        ).values());

        if (uniqueRemotes.length > 0) {
          registerRemotes(uniqueRemotes.map((descriptor) => ({
            type: 'module',
            name: descriptor.remoteName,
            entry: descriptor.entry,
          } as Remote)));
        }

        const loadedComponents: React.FC<any>[] = [];
        for (const descriptor of descriptors) {
          try {
            const module: any = await loadRemote(`${descriptor.remoteName}/${descriptor.modulePath.replace('./', '')}`);
            if (module?.default) {
              loadedComponents.push(module.default as React.FC<any>);
            }
          } catch (error) {
            console.error(`Error loading remote module ${descriptor.remoteName}/${descriptor.modulePath}:`, error);
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
  }, []);
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