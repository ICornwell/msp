import { useEffect, useState } from 'react';
import defaultTheme from './theme.js';
import Spinner from './Spinner.js';
import { AppUiFeatures } from './appUiFeatures.js';
import { AppShell, CustomThemeProvider } from 'msp_ui_common/uiLib/components';
import { UserSessionProvider, UiEventProvider, DataCacheProvider } from 'msp_ui_common/uiLib/contexts';
import {
  ActivityDispatchProvider,
  MenuDispatchProvider,
  NavTreeDispatchProvider,
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
    async function waitForServiceWorkerControl(timeoutMs = 5000): Promise<boolean> {
      if (!('serviceWorker' in navigator)) {
        return false;
      }

      if (navigator.serviceWorker.controller) {
        postServiceWorkerMessage({ type: 'CLEAR_TOKENS', reason: 'App Launched' }, () => {
          console.log('Service Worker sent cleared token message.');
        });
        return true;
      }

      try {
        await navigator.serviceWorker.ready;
      } catch {
        // no-op
      }

      if (navigator.serviceWorker.controller) {
        postServiceWorkerMessage({ type: 'CLEAR_TOKENS', reason: 'App Launched' }, () => {
          console.log('Service Worker sent cleared token message.');
        });
        return true;
      }

      return await new Promise<boolean>((resolve) => {
        const onControllerChange = () => {
          cleanup();
          resolve(true);
        };
        const timeout = setTimeout(() => {
          cleanup();
          resolve(Boolean(navigator.serviceWorker.controller));
        }, timeoutMs);

        const cleanup = () => {
          clearTimeout(timeout);
          navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
        };

        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
      });
    }

    if (!('serviceWorker' in navigator)) {
      setSwRegistered(false);
      return;
    }

    navigator.serviceWorker
      .register('/service-worker.js')
      .then(async (registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
        console.log('Service Worker lifecycle state:', {
          installing: registration.installing?.state,
          waiting: registration.waiting?.state,
          active: registration.active?.state,
          hasController: Boolean(navigator.serviceWorker.controller),
        });

        const isControlled = await waitForServiceWorkerControl();
        if (!isControlled) {
          console.warn('Service Worker registered but controller not active yet; continuing without strict SW gate.');
        }
        postServiceWorkerMessage({ type: 'CLEAR_TOKENS', reason: 'App Launched' }, () => {
          console.log('Service Worker sent cleared token message.');
        });
        setSwRegistered(true);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
        setSwRegistered(false);
      });
  }, []);

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

  return (!swRegistered
    ? (
      <Spinner
        text='MSP Initialising connections...'
        hint='Preparing service worker and auth channels.'
      />
    )
    : (<CustomThemeProvider theme={defaultTheme}>

      <UiEventProvider>
        <UserSessionProvider>
          <DataCacheProvider>
            <ActivityDispatchProvider serviceHubUrl='/api/v1'>
              <NavTreeDispatchProvider>
                <MenuDispatchProvider>
                  <PresentationDispatchProvider>
                    <BehaviourDispatchProvider>
                      <AppUiFeatures />
                      <AppShell />
                    </BehaviourDispatchProvider>
                  </PresentationDispatchProvider>
                </MenuDispatchProvider>
              </NavTreeDispatchProvider>
            </ActivityDispatchProvider>
          </DataCacheProvider>
        </UserSessionProvider>
      </UiEventProvider>
    </CustomThemeProvider>

    ));
};

export default App;