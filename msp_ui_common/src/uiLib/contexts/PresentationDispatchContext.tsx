import { createContext, useContext, useCallback, useRef, useState, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ViewDataIdentifier } from 'msp_common';
import { ReUiPlan } from '../renderEngine/UiPlan/ReUiPlan.js';
import { ContextOwnedItem } from './contextOwnedItem.js';

export type PresentationDispatchRequest = ContextOwnedItem & {
  requestType: 'openBlade' | 'closeBlade' | 'openTab' | 'closeTab' | 'openPagedTab' | 'addTabPage' | 'closeTabPage' | 'navigate' | 'showModal' | 'hideModal' | 'clearContextOwner';
  target?: string;
  params?: any;
};

export type PresentationBladeState = ContextOwnedItem & {
  open: boolean;
  content?: any;
  title?: string | ((context: any) => string);
  viewDataIdentifier?: ViewDataIdentifier;
  bladeWidthPreset?: 1 | 2 | 3 | 4 | 5 | 6;
};

export type PresentationCurrentTab = {
  tab: Tab | null;
  currentPage?: TabPage;
  setTabTitle?: (newTitle: string) => void;
  activatePage?: (pageId: string) => void;
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
  currentTab: { tab: null, currentPage: undefined, setTabTitle: undefined, activatePage: undefined },
  tabSet: { tabs: [], closeTab: () => { }, activateTab: () => { } },
});

export type TabContent = {
  uiPlan: ReUiPlan;
  viewDataIdentifier?: ViewDataIdentifier;
};

export type TabPage = {
  id: string;
  title: string;
  icon?: any;
  content: TabContent;
  isActive?: boolean;
  /** When false the page cannot enter long-scroll mode regardless of user preference. */
  scrollEligible?: boolean;
};

export type Tab = {
  id: string;
  title: string | ((context: any) => string);
  icon?: any;
  isClosable: boolean;
  content: TabContent;
  isActive?: boolean;
  contextOwnerId?: string;
  /** Present → paged tab; absent → flat tab (today's default behaviour). */
  pages?: TabPage[];
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
    contextOwnerId: '',
    bladeWidthPreset: undefined
  });
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [currentTab, setCurrentTab] = useState<Tab | null>(null);
  const currentTabRef = useRef<Tab | null>(null);
  const [currentPage, setCurrentPage] = useState<TabPage | undefined>(undefined);

  const activatePageInTab = useCallback((tab: Tab, pageId: string) => {
    setTabs(prev => prev.map(t =>
      t.id !== tab.id ? t : {
        ...t,
        pages: t.pages?.map(p => ({ ...p, isActive: p.id === pageId }))
      }
    ));
    const page = tab.pages?.find(p => p.id === pageId);
    setCurrentPage(page);
  }, []);

  const setAndActivateTab = useCallback((tab: Tab | null) => {
    currentTabRef.current = tab;
    setTabs(prev => prev.map(t => ({ ...t, isActive: t.id === tab?.id })));
    setCurrentTab(tab);
    // When activating a paged tab, restore the active page (first if none marked).
    if (tab?.pages) {
      const activePage = tab.pages.find(p => p.isActive) ?? tab.pages[0];
      setCurrentPage(activePage);
    } else {
      setCurrentPage(undefined);
    }
  }, []);

  const dispatch = useCallback((request: PresentationDispatchRequest) => {
    switch (request.requestType) {
      case 'openBlade':
        setBladeState({
          open: true, content: request.params?.content,
          viewDataIdentifier: request.params?.viewDataIdentifier,
          title: request.params?.title,
          bladeWidthPreset: request.params?.bladeWidthPreset,
          contextOwnerId: request.contextOwnerId,
        });
        break;
      case 'closeBlade':
        setBladeState({
          open: false,
          content: undefined,
          viewDataIdentifier: undefined,
          title: undefined,
          bladeWidthPreset: undefined,
          contextOwnerId: ''
        });
        break;
      case 'openPagedTab': {
        const tabUId = request.params?.idSuffix ? `${request.target}-${request.params.idSuffix}` : request.target;
        const initialPages: TabPage[] = (request.params?.pages ?? []).map((p: TabPage, i: number) => ({
          ...p,
          isActive: i === 0,
        }));
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
            pages: initialPages,
          };
          setTimeout(() => setAndActivateTab(newTab), 0);
          return [...prev, newTab];
        });
        break;
      }
      case 'addTabPage': {
        const tabId = request.target;
        const newPage: TabPage = {
          id: request.params?.pageId,
          title: request.params?.title ?? 'Page',
          icon: request.params?.icon,
          content: { uiPlan: request.params?.content, viewDataIdentifier: request.params?.viewDataIdentifier },
          scrollEligible: request.params?.scrollEligible,
          isActive: false,
        };
        setTabs(prev => prev.map(t => {
          if (t.id !== tabId) return t;
          const already = t.pages?.find(p => p.id === newPage.id);
          if (already) return t;
          return { ...t, pages: [...(t.pages ?? []), newPage] };
        }));
        if (request.params?.activate) {
          const tab = currentTabRef.current?.id === tabId ? currentTabRef.current : null;
          if (tab) activatePageInTab(tab, newPage.id);
        }
        break;
      }
      case 'closeTabPage': {
        const tabId = request.target;
        const pageId = request.params?.pageId;
        setTabs(prev => prev.map(t => {
          if (t.id !== tabId || !t.pages) return t;
          const next = t.pages.filter(p => p.id !== pageId);
          const wasActive = t.pages.find(p => p.id === pageId)?.isActive;
          if (wasActive && next.length > 0) {
            next[0] = { ...next[0], isActive: true };
            if (currentTabRef.current?.id === tabId) setCurrentPage(next[0]);
          }
          return { ...t, pages: next };
        }));
        break;
      }
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
  }, [setAndActivateTab, activatePageInTab]);

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
        currentPage,
        setTabTitle: (newTitle: string) => setTabTitle(currentTab, newTitle),
        activatePage: (pageId: string) => {
          if (currentTabRef.current) activatePageInTab(currentTabRef.current, pageId);
        },
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
