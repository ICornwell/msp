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

export type PresentationTabSet = Tab[];

export type PresentationDispatchType = {
  dispatch: (request: PresentationDispatchRequest) => void;
};

export type PresentationDispatchContextType = PresentationDispatchType
  & { bladeState: PresentationBladeState, currentTab: PresentationCurrentTab, tabSet: PresentationTabSet };

export const PresentationDispatchContext = createContext<PresentationDispatchContextType>({
  dispatch: () => { },
  bladeState: { open: false, content: undefined, viewDataIdentifier: undefined },
  currentTab: { tab: null, setTabTitle: undefined },
  tabSet: [],
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
          if (tabs.find(tab => tab.id === request.target)) {
            setCurrentTab(tabs.find(tab => tab.id === request.target) || null); // Switch to existing tab
          } else {
            const newTab: Tab = {
              id: request.target,
              title: request.params?.title || 'New Tab',
              isClosable: true,
              content: { uiPlan: request.params?.content, viewDataIdentifier: request.params?.viewDataIdentifier },
            };
            setTabs(prevTabs => [...prevTabs, newTab]);
            setCurrentTab(newTab);
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
      tabSet:tabs,
      
    }}>
      {children}
    </PresentationDispatchContext.Provider>
  );
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

export function usePresentationCurrentTab(): PresentationCurrentTab {
  const { currentTab } = useContext(PresentationDispatchContext);
  return currentTab;
}
