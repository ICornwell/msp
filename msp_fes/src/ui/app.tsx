import { useEffect, useState } from 'react';
// import * as uiComponentsNs from 'msp_ui_common/uiLib/components';
// import * as uiContextsNs from 'msp_ui_common/uiLib/contexts';

import defaultTheme from './theme.js';
// import { styled } from '@mui/material/styles';

import { AppUiFeatures } from './appUiFeatures.js';

// type UiComponentsModule = typeof uiComponentsNs;
// type UiContextsModule = typeof uiContextsNs;
// type UiComponentsModuleWithDefault = UiComponentsModule & { default?: UiComponentsModule };
// type UiContextsModuleWithDefault = UiContextsModule & { default?: UiContextsModule };

// const uiComponents: UiComponentsModule = (uiComponentsNs as UiComponentsModuleWithDefault).default ?? uiComponentsNs;
// const uiContexts: UiContextsModule = (uiContextsNs as UiContextsModuleWithDefault).default ?? uiContextsNs;
// const { AppShell, CustomThemeProvider } = uiComponents;
// const { UiContentProvider, UserSessionProvider } = uiContexts;

import { AppShell, CustomThemeProvider } from 'msp_ui_common/uiLib/components';
import { UiContentProvider, UserSessionProvider, UiEventProvider, DataCacheProvider } from 'msp_ui_common/uiLib/contexts';
import {
  ActivityDispatchProvider,
  MenuDispatchProvider,
  PresentationDispatchProvider
} from 'msp_ui_common/uiLib/contexts';
import { BehaviourDispatchProvider } from 'msp_ui_common/uiLib/behaviours';

import type { AuthenticationResult, AccountInfo } from '@azure/msal-browser'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react';

// force the main ui client to preload the msal modules so that they are cached and available for remotes without each remote needing to include msal as a dependency
const useDummyVars = [{} as AuthenticationResult, PublicClientApplication, {} as AccountInfo, MsalProvider]
console.log(`dummy vars used ${useDummyVars.length}`);

const App: React.FC = () => {

  // Register Service Worker
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setSwRegistered(false);
      return;
    }

    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
        console.log('Service Worker lifecycle state:', {
          installing: registration.installing?.state,
          waiting: registration.waiting?.state,
          active: registration.active?.state,
          hasController: Boolean(navigator.serviceWorker.controller),
        });
        setSwRegistered(true);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
        setSwRegistered(false);
      });
  }, []);

  return (!swRegistered
    ? (
      <>
        Registering, please wait...
      </>
    )
    : (<CustomThemeProvider theme={defaultTheme}>

      <UiContentProvider>
        <UiEventProvider>
          <UserSessionProvider>
            <DataCacheProvider>
              <ActivityDispatchProvider serviceHubUrl='/api/v1'>
                <MenuDispatchProvider>
                  <PresentationDispatchProvider>
                    <BehaviourDispatchProvider>
                      <AppUiFeatures />
                      <AppShell />
                    </BehaviourDispatchProvider>
                  </PresentationDispatchProvider>
                </MenuDispatchProvider>
              </ActivityDispatchProvider>
            </DataCacheProvider>
          </UserSessionProvider>
        </UiEventProvider>
      </UiContentProvider>
    </CustomThemeProvider>

    ));
};

export default App;