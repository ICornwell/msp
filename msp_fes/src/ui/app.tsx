
import { AppShell } from './components/AppShell';
import { EventProvider } from './contexts/EventContext';
import { UserSessionProvider } from './contexts/UserSessionContext';
import { CustomThemeProvider } from './components/CustomThemeProvider';

import defaultTheme from './theme.js';
import { styled } from '@mui/material';




const App: React.FC = () => {
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