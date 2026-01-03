import { useEffect } from 'react';
import { AppShell } from './components/AppShell';
import { EventProvider } from './contexts/EventContext';
import { UserSessionProvider } from './contexts/UserSessionContext';
import { CustomThemeProvider } from './components/CustomThemeProvider';

import defaultTheme from './theme.js';
import { styled } from '@mui/material';
import { getAvailableFeatures } from './comms/serverRequests.js';




const App: React.FC = () => {

// Register Service Worker

  useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
        getAvailableFeatures().then((features) => {
          console.log('Discovered UI Features:', features);
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  }
});

  return (
 
      <CustomThemeProvider theme={defaultTheme}>
        <UserSessionProvider>
          <EventProvider>
            <AppShell />
          </EventProvider>
        </UserSessionProvider>
      </CustomThemeProvider>
 
  );
};

export default App;