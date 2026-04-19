import { createContext, useContext, useCallback, useRef, useState, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ViewDataIdentifier } from 'msp_common';
import { ReUiPlan } from '../renderEngine/UiPlan/ReUiPlan.js';
import { ContextOwnedItem } from './contextOwnedItem.js';

export type PresentationDispatchRequest = ContextOwnedItem & {
  requestType: 'openBlade' | 'closeBlade' | 'openTab' | 'closeTab' | 'navigate' | 'showModal' | 'hideModal' | 'clearContextOwner';
  target?: string;
  params?: any;
};

export type PresentationBladeState = ContextOwnedItem & {
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
  bladeState: {
    open: false, content: undefined,
    viewDataIdentifier: undefined, contextOwnerId: ''
  },
  currentTab: { tab: null, setTabTitle: undefined },
  tabSet: { tabs: [], closeTab: () => { }, activateTab: () => { } },
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
  contextOwnerId?: string;
}

/**
 * Subsystem provider for presentation navigation.
 *
 * Publishes PresentationRequest UIEvents so Behaviours and shell components can
 * observe and react (e.g. open a Blade, switch tabs). Will be replaced with a
 * richer implementation that manages cross-feature navigation state directly.
 */
export function PresentationDispatchProvider({ children }: { children: ReactNode }) {
  const [bladeState, setBladeState] = useState<PresentationBladeState>({
    open: false,
    content: undefined,
    viewDataIdentifier: undefined,
    contextOwnerId: ''
  });
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [currentTab, setCurrentTab] = useState<Tab | null>(null);
  const currentTabRef = useRef<Tab | null>(null);

  const setAndActivateTab = useCallback((tab: Tab | null) => {
    currentTabRef.current = tab;
    setTabs(prev => prev.map(t => ({ ...t, isActive: t.id === tab?.id })));
    setCurrentTab(tab);
  }, []);

  const dispatch = useCallback((request: PresentationDispatchRequest) => {
    switch (request.requestType) {
      case 'openBlade':
        setBladeState({
          open: true, content: request.params?.content,
          viewDataIdentifier: request.params?.viewDataIdentifier,
          title: request.params?.title,
          contextOwnerId: request.contextOwnerId,
        });
        break;
      case 'closeBlade':
        setBladeState({
          open: false,
          content: undefined,
          viewDataIdentifier: undefined,
          title: undefined,
          contextOwnerId: ''
        });
        break;
      case 'openTab': {
        const tabUId = request.params?.idSuffix ? `${request.target}-${request.params.idSuffix}` : request.target;
        setTabs(prev => {
          const existing = prev.find(t => t.id === tabUId);
          if (existing) {
            setAndActivateTab(existing);
            return prev;
          }
          const newTab: Tab = {
            id: tabUId ?? uuidv4(),
            contextOwnerId: request.contextOwnerId,
            title: request.params?.title || 'New Tab',
            isClosable: request.params?.closable ?? true,
            content: { uiPlan: request.params?.content, viewDataIdentifier: request.params?.viewDataIdentifier },
          };
          setTimeout(() => {
            setAndActivateTab(newTab);
          }, 0);
          return [...prev, newTab];
        });
        break;
      }
      case 'closeTab': {
        if (!request.params?.idSuffix) break;
        const tabIdToClose = `${request.target}-${request.params.idSuffix}`;
        setTabs(prev => {
          const next = prev.filter(t => t.id !== tabIdToClose);
          if (currentTabRef.current?.id === tabIdToClose) {
            setAndActivateTab(next[0] ?? null);
          }
          return next;
        });
        break;
      }
      case 'clearContextOwner': {
        if (!request.contextOwnerId) break;
        setBladeState(prev =>
          prev.contextOwnerId === request.contextOwnerId
            ? { open: false, content: undefined, viewDataIdentifier: undefined, title: undefined, contextOwnerId: '' }
            : prev
        );
        setTabs(prev => {
          const next = prev.filter(t => t.contextOwnerId !== request.contextOwnerId);
          if (currentTabRef.current?.contextOwnerId === request.contextOwnerId) {
            setAndActivateTab(next[0] ?? null);
          }
          return next;
        });
        break;
      }
    }
  }, [setAndActivateTab]);

  const setTabTitle = useCallback((tab: Tab | null, newTitle: string) => {
    if (!tab) return;
    setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, title: newTitle } : t));
    setCurrentTab(prev => prev?.id === tab.id ? { ...prev, title: newTitle } : prev);
    if (currentTabRef.current?.id === tab.id) {
      currentTabRef.current = { ...currentTabRef.current, title: newTitle };
    }
  }, []);

  return (
    <PresentationDispatchContext.Provider value={{
      dispatch, bladeState,
      currentTab: {
        tab: currentTab,
        setTabTitle: (newTitle: string) => setTabTitle(currentTab, newTitle)
      },
      tabSet: {
        tabs,
        closeTab: (tabId: string) => {
          setTabs(prev => {
            const next = prev.filter(t => t.id !== tabId);
            if (currentTabRef.current?.id === tabId) {
              setTimeout(() => {
                setAndActivateTab(next[0] ?? null);
              }, 0);
            }
            return next;
          });
        },
        activateTab: (tabId: string) => {
          setTabs(prev => {
            const tab = prev.find(t => t.id === tabId);
            if (tab) {
              setTimeout(() => {
                setAndActivateTab(tab);
              }, 0);
            }
            return prev;
          });
        }
      },
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

export function usePresentationCurrentTab(onTabChange?: (tab?: Tab) => void): PresentationCurrentTab {
  const { currentTab } = useContext(PresentationDispatchContext);
  const [currentTabState, setCurrentTabState] = useState(currentTab);
  if (currentTabState?.tab?.id !== currentTab?.tab?.id) {
    setCurrentTabState(currentTab);
    onTabChange?.(currentTab?.tab ?? undefined);
  }
  return currentTab;
}
