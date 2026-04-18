import { useRef, useContext, createContext } from 'react';
import { AuthenticationResult, PublicClientApplication, AccountInfo } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react';
import { v4 } from 'uuid';
import { useUiEventPublisher } from './UiEventContext.js';

export type UserSessionEventsType = {
  USER_LOGGED_IN: 'USER_LOGGED_IN',
  USER_LOGGED_OUT: 'USER_LOGGED_OUT'
}

export const UserSessionEvents: UserSessionEventsType = {
  USER_LOGGED_IN: 'USER_LOGGED_IN',
  USER_LOGGED_OUT: 'USER_LOGGED_OUT'
}

// MSAL Configuration
const viteEnv = (import.meta as any).env ?? {};

const msalConfig = {
  auth: {
    // clientId: '76202d65-88a6-4d3e-8bf6-b67ecb0fe78c',
    // authority: 'https://login.microsoftonline.com/027f47db-adad-450a-8118-4bd5b6feef63',
    // redirectUri: 'http://localhost:3000', // Your redirect URI
    // postLogoutRedirectUri: 'http://localhost:3000', // Your post logout redirect URI
    clientId: viteEnv.VITE_clientId,
    authority: viteEnv.VITE_authority,
    redirectUri: viteEnv.VITE_redirectUri,
    postLogoutRedirectUri: viteEnv.VITE_postLogoutRedirectUri,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },

};

const msalInstance = new PublicClientApplication(msalConfig);

export interface UserSessionState {
  isAuthenticated: boolean;
  userName?: string;
  userId?: string;
  userClaims?: Record<string, any>;
  accessToken?: string;
  idToken?: string;
  sessionId?: string;
}

export type SessionInfo = {
  userName?: string;
  userId?: string;
  // TODO: other session related info we want to make available for behaviours to consume when making decisions or calling activities
  // no tokens here - we want to keep tokens out of the hands of behaviours for security reasons.
  //  We can provide relevant claims from the token in the userClaims field if needed
  //  but as the browser is untrusted, all 'real' authorisation must be determined server-side
}

const initialState: UserSessionState = {
  isAuthenticated: false,
  userName: undefined,
  userId: undefined,
  userClaims: undefined,
  accessToken: undefined,
  idToken: undefined,
  sessionId: undefined,
};

export type UserChangeHandler = {
  onLoggedIn: (sessionInfo: SessionInfo) => void;
  onLoggedOut: (sessionInfo: SessionInfo) => void;
}


const userChangeHandlers: Record<string, UserChangeHandler> = {}

// Create context
export const UserSessionContext = createContext<{
  //currentUser: UserSessionState;
  addHandler: (id: string, handler: UserChangeHandler) => void;
  removeHandler: (id: string) => void;
  getSessionInfo: () => SessionInfo;
  login: () => void
  loggedOut: () => void
}>({
  addHandler: (_id: string, _handler: UserChangeHandler) =>{},
  removeHandler: (_id: string) => {},
  getSessionInfo: () => ({ userName: undefined, userId: undefined }),
  login: () => { },
  loggedOut: () => { }
});

// UserSession provider component
export const UserSessionProvider = ({ children }: { children: any }) => {
  const { raiseUiEvent } = useUiEventPublisher();
  const state = useRef(initialState);
  const loggedIn = (accountInfo: AccountInfo) => {
    if (state.current.isAuthenticated) {
      raiseUiEvent({messageType: UserSessionEvents.USER_LOGGED_OUT, payload: state.current, timestamp: Date.now(), correlationId: v4()});
    }
    const uss: UserSessionState = {
      isAuthenticated: true,
      userName: accountInfo.name,
      userId: accountInfo.username,
      userClaims: accountInfo.idTokenClaims,
      accessToken: accountInfo.idToken,
      idToken: accountInfo.idToken,
      sessionId: v4()
    }
    state.current = uss;
    raiseUiEvent({messageType: UserSessionEvents.USER_LOGGED_IN, payload: uss,
      timestamp: Date.now(), correlationId: v4() });
    callHandlers();
  };
  const loggedOut = () => {
    raiseUiEvent({messageType: UserSessionEvents.USER_LOGGED_OUT, payload: state.current, timestamp: Date.now(), correlationId: v4()});
    
    state.current = initialState;
    callHandlers();
  };

  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && window.location.hash) {
    msalInstance.initialize().then(() => {
      msalInstance.handleRedirectPromise(window.location.hash).then(handleResponse).catch((error) => {
        console.error('Error during redirect handling:', error);
      }
      );
    })
  }

  if (state.current.isAuthenticated && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    // Send user info to service worker
    const sw = (navigator as any).serviceWorker;
    if (sw && typeof sw.getRegistration === 'function') {
      sw.getRegistration().then((registration: any) => {
        // You can now use the registration object
        registration?.active?.postMessage({ type: 'USER_INFO', userIdToken: state.current.idToken });
        console.log('Service Worker sent token:', state.current.idToken);
      }).catch((error: any) => {
        console.error('Error fetching Service Worker registration:', error);
      });
    }
  }

  function handleResponse(response: AuthenticationResult | null) {
    if (response !== null) {
      loggedIn(response.account);
      // Display signed-in user content, call API, etc.
    } else {
      // In case multiple accounts exist, you can select
      const currentAccounts = msalInstance.getAllAccounts();

      if (currentAccounts.length === 0) {
        // no accounts signed-in, attempt to sign a user in
        msalInstance.loginRedirect({
          scopes: ['user.read'],
          prompt: 'select_account'
        });
      } else if (currentAccounts.length > 1) {
        // Add choose account code here
      } else if (currentAccounts.length === 1) {
        loggedIn(currentAccounts[0]);
      }
    }
  }

  function addHandler(id: string, handler: UserChangeHandler) {
    userChangeHandlers[id] = handler;
  }

  function removeHandler(id: string) {
    delete userChangeHandlers[id];
  }

  async function login() {
    msalInstance.handleRedirectPromise().then(handleResponse);
  }

  function callHandlers() {
    const sessionInfo = getSessionInfo();
    Object.values(userChangeHandlers).forEach(h => {
      if (state.current.isAuthenticated) {
        h.onLoggedIn(sessionInfo);
      } else {
        h.onLoggedOut(sessionInfo);
      }
    });
  }

  const getSessionInfo = () => {
    return {
      userName: state.current.userName,
      userId: state.current.userId,
    }
  }


  return (
    <UserSessionContext.Provider value={
      {
        addHandler,
        removeHandler,
        getSessionInfo,
        login,
        loggedOut
      }}>
      <MsalProvider instance={msalInstance}>
        {children}
      </MsalProvider>
    </UserSessionContext.Provider>
  );
};

// Custom hook to access the context
export const useUserSessionContext = () => useContext(UserSessionContext);