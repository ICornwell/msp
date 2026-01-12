import { useEffect } from 'react';
import { AppShell } from './components/AppShell.js';
import { UiContentProvider } from './contexts/UiContentContext.js';
import { UserSessionProvider } from './contexts/UserSessionContext.js';
import { CustomThemeProvider } from './components/CustomThemeProvider.js';

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