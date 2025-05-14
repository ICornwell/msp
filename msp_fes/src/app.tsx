
import { AppShell } from './components/AppShell';
import { EventProvider } from './contexts/EventContext';
import { UserSessionProvider } from './contexts/UserSessionContext';

const App: React.FC = () => {
  return (
    <UserSessionProvider>
      <EventProvider>
        <AppShell/>
      </EventProvider>
    </UserSessionProvider>
  );
};

export default App;