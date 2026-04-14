import { createContext, useContext, useState, type ReactNode } from 'react';
import { ViewDataIdentifier } from 'msp_common';
import { ReUiPlan } from '../renderEngine/UiPlan/ReUiPlan.js';

export type PresentationDispatchRequest = {
  requestType: 'openBlade' | 'closeBlade' | 'openTab' | 'closeTab' | 'navigate' | 'showModal' | 'hideModal';
  target: string;
  params?: any;
};

export type PresentationBladeState = {
  open: boolean;
  content?: any;
  title?: string | ((context: any) => string);
  viewDataIdentifier?: ViewDataIdentifier;
};

export type PresentationCurrentTab = {
  tab: Tab | null;
  setTabTitle?: (newTitle: string) => void; // Optional function to update the title of a tab
}

export type PresentationTabSet = {
  tabs: Tab[];
  closeTab: (tabId: string) => void;
  activateTab: (tabId: string) => void; 
};

export type PresentationDispatchType = {
  dispatch: (request: PresentationDispatchRequest) => void;
};

export type PresentationDispatchContextType = PresentationDispatchType
  & { bladeState: PresentationBladeState, currentTab: PresentationCurrentTab, tabSet: PresentationTabSet };

export const PresentationDispatchContext = createContext<PresentationDispatchContextType>({
  dispatch: () => { },
  bladeState: { open: false, content: undefined, viewDataIdentifier: undefined },
  currentTab: { tab: null, setTabTitle: undefined },
  tabSet: { tabs: [], closeTab: () => {}, activateTab: () => {} },
});

export type TabContent = {
  uiPlan: ReUiPlan;
  viewDataIdentifier?: ViewDataIdentifier;
};

export type Tab = {
  id: string;
  title: string | ((context: any) => string);
  icon?: any;
  isClosable: boolean;
  content: TabContent;
  isActive?: boolean;
}

/**
 * Subsystem provider for presentation navigation.
 *
 * Publishes PresentationRequest UIEvents so Behaviours and shell components can
 * observe and react (e.g. open a Blade, switch tabs). Will be replaced with a
 * richer implementation that manages cross-feature navigation state directly.
 */
export function PresentationDispatchProvider({ children }: { children: ReactNode }) {
  const [bladeState, setBladeState] = useState<PresentationBladeState>({ open: false, content: undefined, viewDataIdentifier: undefined });
  const [tabs, setTabs] = useState<Tab[]>([]); // Placeholder for tab state management
  const [currentTab, setCurrentTab] = useState<Tab | null>(null); // Placeholder for current tab tracking
  const dispatch =
    (request: PresentationDispatchRequest) => {
      switch (request.requestType) {
        case 'openBlade':
          setBladeState({
            open: true, content: request.params?.content,
            viewDataIdentifier: request.params?.viewDataIdentifier,
            title: request.params?.title
          });
          break;
        case 'closeBlade':
          setBladeState({ open: false, content: undefined, viewDataIdentifier: undefined, title: undefined });
          break;
        case 'openTab':
          const tabUId = request.params?.idSuffix ? `${request.target}-${request.params.idSuffix}` : request.target;
          if (tabs.find(tab => tab.id === tabUId)) {
            const existingTab = tabs.find(tab => tab.id === tabUId);
            setAndActivateTab(existingTab); // Switch to existing tab

          } else {
            const newTab: Tab = {
              id: tabUId,
              title: request.params?.title || 'New Tab',
              isClosable: request.params?.closable ?? true,
              content: { uiPlan: request.params?.content, viewDataIdentifier: request.params?.viewDataIdentifier },
            };
            setTabs(prevTabs => [...prevTabs, newTab]);
            setAndActivateTab(newTab);
          }

        // case 'closeTab':
        // case 'navigate':
        //   // For now, just raise a UIEvent and let the shell handle it. Eventually we want to manage this state here too.
        //   raiseUiEvent({ eventName: 'PresentationRequest', data: request });
        //   break;
      }
    }

  const setTabTitle = (tab: Tab | null, newTitle: string) => {
    if (!tab) return;
    setTabs(prevTabs => prevTabs.map(t => t.id === tab.id ? { ...t, title: newTitle } : t));
    if (currentTab?.id === tab.id) {
      setCurrentTab({ ...tab, title: newTitle });
    }
  }

  return (
    <PresentationDispatchContext.Provider value={{
      dispatch, bladeState,
      currentTab: {tab: currentTab,
        setTabTitle: (newTitle: string) => setTabTitle(currentTab, newTitle)
      },
      tabSet: {
        tabs,
        closeTab: (tabId: string) => {
          setTabs(prevTabs => prevTabs.filter(tab => tab.id !== tabId));
          if (currentTab?.id === tabId) {
            setAndActivateTab(tabs[0] || null); // Activate another tab if the current one is closed
          }
        },
        activateTab: (tabId: string) => {
          const tabToActivate = tabs.find(tab => tab.id === tabId);
          if (tabToActivate) {
            setAndActivateTab(tabToActivate);
          }
        }
      },
      
    }}>
      {children}
    </PresentationDispatchContext.Provider>
  );

  function setAndActivateTab(existingTab: Tab | undefined) {
    tabs.forEach(tab => {
      if (tab && tab === existingTab) {
        tab.isActive = true;
      } else if (tab) {
        tab.isActive = false;
      }
    });
    setCurrentTab(existingTab || null);
  }
}

/**
 * Used exclusively by Behaviours (via BehaviourDispatchProvider) to
 * dispatch presentation requests. Not for use in leaf UI components.
 */
export function usePresentationDispatch(): PresentationDispatchType {
  const { dispatch } = useContext(PresentationDispatchContext);
  return { dispatch };
}

export function usePresentationBladeState(): PresentationBladeState {
  const { bladeState } = useContext(PresentationDispatchContext);
  return bladeState;
}

export function usePresentationTabSet(): PresentationTabSet {
  const { tabSet } = useContext(PresentationDispatchContext);
  return tabSet;
}

export function usePresentationCurrentTab(onTabChange?: (tab?: Tab) => void): PresentationCurrentTab {
  const { currentTab } = useContext(PresentationDispatchContext);
  const [currentTabState, setCurrentTabState] = useState(currentTab);
  if (currentTabState?.tab?.id !== currentTab?.tab?.id) {
    setCurrentTabState(currentTab);
    onTabChange?.(currentTab?.tab ?? undefined);
  }
  return currentTab;
}
