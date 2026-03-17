import { useEffect } from 'react';
import * as uiComponentsNs from 'msp_ui_common/uiLib/components';
import * as uiContextsNs from 'msp_ui_common/uiLib/contexts';

import defaultTheme from './theme.js';
import { styled } from '@mui/material/styles';

import { AppUiFeatures } from './appUiFeatures.js';

type UiComponentsModule = typeof uiComponentsNs;
type UiContextsModule = typeof uiContextsNs;
type UiComponentsModuleWithDefault = UiComponentsModule & { default?: UiComponentsModule };
type UiContextsModuleWithDefault = UiContextsModule & { default?: UiContextsModule };

const uiComponents: UiComponentsModule = (uiComponentsNs as UiComponentsModuleWithDefault).default ?? uiComponentsNs;
const uiContexts: UiContextsModule = (uiContextsNs as UiContextsModuleWithDefault).default ?? uiContextsNs;
const { AppShell, CustomThemeProvider } = uiComponents;
const { UiContentProvider, UserSessionProvider } = uiContexts;

const App: React.FC = () => {

// Register Service Worker

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
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
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  }, []);

  return (
 
      <CustomThemeProvider theme={defaultTheme}>
        <UserSessionProvider>
          <UiContentProvider>
            <AppUiFeatures />
            <AppShell />
          </UiContentProvider>
        </UserSessionProvider>
      </CustomThemeProvider>
 
  );
};

export default App;