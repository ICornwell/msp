import { useEffect, useState, useRef, memo } from "react";
import { loadRemote, registerRemotes } from '@module-federation/runtime';
import { Remote } from "@module-federation/runtime/types";
import { useEventContext } from "./contexts/UiContentContext.js";

import type { UiFeatureManifestSection } from "msp_common";
import { getAvailableFeatures } from "./comms/serverRequests.js";

export function AppUiFeatures() {
  const [loadedFeatures, setLoadedFeatures] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [uiFeatures, setUiFeatures] = useState<UiFeatureManifestSection[]>([]);
  const eventContext = useEventContext();
  const componentRef = useRef<React.FC<any>[]>([]);


  if (!loadedFeatures) {
    getAvailableFeatures().then((features) => {
      console.log('Discovered UI Features:', features);

      registerRemotes([
        {
          type: 'module',
          name: 'servicehub',
          entry: 'http://localhost:3001/servicehub_remoteEntry.js',
        } as Remote
      ])

      setUiFeatures(features);
      setLoadedFeatures(true);
    });


  }

  if (loadedFeatures && !loaded) {
    const modulePromise: any = loadRemote('servicehub/AppCore');

    modulePromise.then((module: any) => {
      console.log('Loaded module:', module);
      const component = module.default as React.FC<any>;
      componentRef.current.push(component);
      setLoaded(true);
    }).catch((error: any) => {
      console.error('Error loading module:', error);
    });


  }


  return (<>
    {loaded && componentRef.current.map((Component, index) => {
      const MemoComponent = memo(Component);
      return (<>
        <MemoComponent key={index} />
      </>);
    }
    )}
  </>)
}

export default AppUiFeatures;