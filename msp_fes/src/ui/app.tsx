import { useEffect } from 'react';
import { AppShell } from 'msp_ui_common/uiLib/components';
import { UiContentProvider } from 'msp_ui_common/uiLib/contexts';
import { UserSessionProvider } from 'msp_ui_common/uiLib/contexts';
import { CustomThemeProvider } from 'msp_ui_common/uiLib/components';

import defaultTheme from './theme.js';
import { styled } from '@mui/material';

import { AppUiFeatures } from './appUiFeatures.js';

const App: React.FC = () => {

// Register Service Worker

  useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
       
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  }
});

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