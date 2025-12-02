import { useState, useContext, createContext  } from 'react';
import { AuthenticationResult, PublicClientApplication, AccountInfo } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react';
import { v4 } from 'uuid';

// MSAL Configuration
const msalConfig = {
  auth: {
    clientId: '76202d65-88a6-4d3e-8bf6-b67ecb0fe78c',
    authority: 'https://login.microsoftonline.com/027f47db-adad-450a-8118-4bd5b6feef63',
    redirectUri: 'http://localhost:3000', // Your redirect URI
    postLogoutRedirectUri: 'http://localhost:3000', // Your post logout redirect URI
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

const initialState: UserSessionState = {
  isAuthenticated: false,
  userName: undefined,
  userId: undefined,
  userClaims: undefined,
  accessToken: undefined,
  idToken: undefined,
  sessionId: undefined,
};

// Create context
export const UserSessionContext = createContext<{
  currentUser: UserSessionState;
  login: () => void
  loggedOut: () => void
}>({
  currentUser: initialState,
  login: () => { },
  loggedOut: () => { }
});

// UserSession provider component
export const UserSessionProvider = ({ children }: { children: any }) => {
  const [state, setState] = useState(initialState);
  const loggedIn = (accountInfo: AccountInfo) => {
    setState({
      isAuthenticated: true,
      userName: accountInfo.name,
      userId: accountInfo.username,
      userClaims: accountInfo.idTokenClaims,
      accessToken: accountInfo.idToken,
      idToken: accountInfo.idToken,
      sessionId: v4()
    });
  };
  const loggedOut = () => {
    setState(initialState);
  };

  if (window.location.hash) {
    msalInstance.initialize().then(() => {
      msalInstance.handleRedirectPromise(window.location.hash).then(handleResponse).catch((error) => {
        console.error('Error during redirect handling:', error);
      }
      );
    })
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
        loggedIn(currentAccounts[0])
      }
    }
  }



  async function login() {
    msalInstance.handleRedirectPromise().then(handleResponse);
  }
  //   try {
  //     const response: AuthenticationResult = await msalInstance.loginPopup({
  //       scopes: ['user.read'],
  //       prompt: 'select_account'
  //     });

  //     if (response.account) {
  //       loggedIn(response.account);
  //     }
  //   } catch (error) {
  //     console.error('Login failed', error);
  //   }
  // };


  return (
    <UserSessionContext.Provider value={
      {
        currentUser: state,
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