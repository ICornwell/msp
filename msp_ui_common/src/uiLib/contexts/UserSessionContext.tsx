import { useRef, useContext, createContext, useEffect, } from 'react';
import { AuthenticationResult, PublicClientApplication, AccountInfo } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react';
import { v4 } from 'uuid';
import { useUiEventPublisher, useUiEventReset } from './UiEventContext.js';

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

const tokenScopes = String(viteEnv.VITE_scopes ?? viteEnv.VITE_scope ?? '')
  .split(/[\s,]+/)
  .map((scope: string) => scope.trim())
  .filter((scope: string) => scope.length > 0);

if (tokenScopes.length === 0) {
  throw new Error('Missing VITE_scopes (or VITE_scope). Configure API scopes explicitly to acquire tokens with the correct audience.');
}

const authScopes = tokenScopes;

const msalInstance = new PublicClientApplication(msalConfig);

function extractClaimsFromIdToken(idToken?: string): Record<string, any> | undefined {
  if (!idToken) {
    return undefined;
  }

  try {
    const payload = idToken.split('.')[1];
    if (!payload) {
      return undefined;
    }

    const normalised = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalised);
    return JSON.parse(decoded) as Record<string, any>;
  } catch (error) {
    console.warn('Unable to parse id token claims from token payload.', error);
    return undefined;
  }
}

export interface UserSessionState {
  isAuthenticated: boolean;
  userName?: string;
  userId?: string;
  userClaims?: Record<string, any>;
  accessToken?: string;
  idToken?: string;
  tokenExpiresAtEpochMs?: number;
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
  tokenExpiresAtEpochMs: undefined,
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
  const { reset } = useUiEventReset();
  const state = useRef(initialState);
 

  const tokenRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function clearTokenRefreshTimer() {
    if (tokenRefreshTimerRef.current) {
      clearTimeout(tokenRefreshTimerRef.current);
      tokenRefreshTimerRef.current = undefined;
    }
  }

  function postServiceWorkerMessage(message: Record<string, unknown>, callback: () => void) {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      callback();
      return;
    }

    const sw = (navigator as any).serviceWorker;
    try {
      if (sw?.controller?.postMessage) {
        sw.controller.postMessage(message);
        callback();
        return;
      }
    } catch (error) {
      console.warn('Error posting message to active service worker controller:', error);
    }

    if (sw && typeof sw.getRegistration === 'function') {
      sw.getRegistration().then((registration: any) => {
        const target = registration?.active ?? registration?.waiting ?? registration?.installing;
        target?.postMessage?.(message);
        callback();
      }).catch((error: any) => {
        console.error('Error fetching Service Worker registration:', error);
        callback();
      });
      return;
    }

    callback();
  }

  function scheduleTokenRefresh(expiresOn?: Date) {
    clearTokenRefreshTimer();

    if (!expiresOn) {
      console.warn('Token refresh not scheduled because token expiry was unavailable.');
      return;
    }

    const refreshAtMs = expiresOn.getTime() - 30_000;
    const delayMs = Math.max(refreshAtMs - Date.now(), 0);

    tokenRefreshTimerRef.current = setTimeout(() => {
      void refreshTokenAndReshare();
    }, delayMs);

    console.log('Scheduled token refresh in ms:', delayMs);
  }

  async function refreshTokenAndReshare() {
    if (!state.current.isAuthenticated) {
      return;
    }

    const accounts = msalInstance.getAllAccounts();
    const preferredAccount = accounts.find(acc => acc.username === state.current.userId) ?? accounts[0];
    if (!preferredAccount) {
      console.warn('Token refresh skipped: no active account in MSAL cache.');
      return;
    }

    try {
      const tokenResult = await msalInstance.acquireTokenSilent({
        account: preferredAccount,
        scopes: authScopes,
      });

      const updatedState: UserSessionState = {
        ...state.current,
        isAuthenticated: true,
        userName: preferredAccount.name,
        userId: preferredAccount.username,
        userClaims: extractClaimsFromIdToken(tokenResult.idToken) ?? state.current.userClaims,
        accessToken: tokenResult.accessToken,
        idToken: tokenResult.idToken,
        tokenExpiresAtEpochMs: tokenResult.expiresOn?.getTime(),
      };

      state.current = updatedState;
      registerTokenWithServiceWorker(updatedState, () => {
        console.log('Service Worker refreshed token shared.');
      });
      scheduleTokenRefresh(tokenResult.expiresOn ?? undefined);
    } catch (error) {
      console.error('Silent token refresh failed:', error);
    }
  }

  const loggedIn = (accountInfo: AccountInfo) => {
    clearTokenRefreshTimer();
    // if (state.current.isAuthenticated) {
    //   raiseUiEvent({messageType: UserSessionEvents.USER_LOGGED_OUT, payload: state.current, timestamp: Date.now(), correlationId: v4()});
    // }
    const pendingSessionState: UserSessionState = {
      isAuthenticated: true,
      userName: accountInfo.name,
      userId: accountInfo.username,
      userClaims: extractClaimsFromIdToken(accountInfo.idToken) ?? accountInfo.idTokenClaims,
      accessToken: undefined,
      idToken: undefined,
      tokenExpiresAtEpochMs: undefined,
      sessionId: v4()
    };

    state.current = pendingSessionState;

    // Acquire a full id/access token pair before sharing to SW or raising login events.
    void refreshTokenAndReshare().then(() => {
      registerTokenWithServiceWorker(state.current, () => {
        raiseUiEvent({messageType: UserSessionEvents.USER_LOGGED_IN, payload: state.current,
          timestamp: Date.now(), correlationId: v4() });
        callHandlers();
      });
    });
  };
  const loggedOut = () => {
    clearTokenRefreshTimer();
    deregisterTokenWithServiceWorker(state.current, () => {
      raiseUiEvent({messageType: UserSessionEvents.USER_LOGGED_OUT, payload: state.current, timestamp: Date.now(), correlationId: v4()});
      state.current = initialState;
      callHandlers();
    });
    reset(); // reset the context to clear all subscriptions and state
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

  useEffect(() => {
    // Defensive reset on app init to avoid stale tokens in a long-lived service worker.
    postServiceWorkerMessage({ type: 'CLEAR_TOKENS', reason: 'app-init' }, () => {
      console.log('Service Worker token state cleared on app init.');
    });
  }, []);


function registerTokenWithServiceWorker(state: UserSessionState,callback: () => void) {
  if (!state.isAuthenticated) {
    callback();
    return;
  }

  postServiceWorkerMessage({
    type: 'USER_INFO',
    userAccessToken: state.accessToken,
    userIdToken: state.idToken,
    tokenExpiresAtEpochMs: state.tokenExpiresAtEpochMs,
  }, () => {
    console.log('Service Worker sent token update.', {
      hasAccessToken: Boolean(state.accessToken),
      hasIdToken: Boolean(state.idToken),
      tokenExpiresAtEpochMs: state.tokenExpiresAtEpochMs,
    });
    callback();
  });
}

function deregisterTokenWithServiceWorker(state: UserSessionState,callback: () => void) {
  if (!state.isAuthenticated) {
    callback();
    return;
  }

  postServiceWorkerMessage({ type: 'CLEAR_TOKENS', reason: 'logout' }, () => {
    console.log('Service Worker sent cleared token message.');
    callback();
  });
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
          scopes: authScopes,
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
        <div key={state.current.userId}>
          {children}
        </div>
      </MsalProvider>
    </UserSessionContext.Provider>
  );
};

// Custom hook to access the context
export const useUserSessionContext = () => useContext(UserSessionContext);