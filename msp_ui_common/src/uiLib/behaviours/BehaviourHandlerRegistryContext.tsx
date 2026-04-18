import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useActivityDispatch } from '../contexts/ActivityDispatchContext.js';
import { useMenuDispatch } from '../contexts/MenuDispatchContext.js';
import { useNavTreeDispatch } from '../contexts/NavTreeDispatchContext.js';
import { usePresentationDispatch } from '../contexts/PresentationDispatchContext.js';
import { useDataDispatch } from '../contexts/DataCacheContext.js';
import type { RequestAction } from './behaviourConfig.js';
import { useUserSession } from '../hooks/index.js';
import { SessionInfo } from '../contexts/UserSessionContext.js';

/**
 * An ActionHandler receives a RequestAction (from the behaviour config) plus the
 * triggering UIEvent and current data snapshot, and dispatches directly to the
 * appropriate subsystem. Handlers are void — dispatch is side-effectful, not
 * message-building.
 */
export type ActionHandler = (
  action: RequestAction<any, any>,
  event: any,
  data: any,
) => void;

/**
 * Registry maps action.eventType strings to the handler that owns that subsystem.
 * A nested BehaviourHandlerRegistryProvider can override or extend the parent
 * registry for localised behaviour in a sub-tree.
 */
export type BehaviourHandlerRegistry = Map<string, ActionHandler>;

const BehaviourHandlerRegistryContext = createContext<BehaviourHandlerRegistry>(new Map());

// ── BehaviourDispatchProvider ─────────────────────────────────────────────────
//
// Must sit above Behaviour components in the tree, inside all subsystem providers
// (ActivityDispatchProvider, MenuDispatchProvider, PresentationDispatchProvider,
// DataCacheProvider) and inside UiEventProvider.
// This is the only place the subsystem dispatch hooks are called.

type BehaviourDispatchProviderProps = { children: ReactNode };

export function BehaviourDispatchProvider({ children }: BehaviourDispatchProviderProps) {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  useUserSession({
    onLoggedIn: (sessionInfo: SessionInfo) => { setSessionInfo(sessionInfo); },
    onLoggedOut: () => { setSessionInfo(null); },
  });
  const { callActivity } = useActivityDispatch();
  const { dispatch: dispatchMenu } = useMenuDispatch();
  const { dispatch: dispatchPresentation } = usePresentationDispatch();
  const { dispatch: dispatchNavTree } = useNavTreeDispatch();
  const { invalidate, save } = useDataDispatch();

  function objectFromMaybeFunction(maybeFn: any, data: any): Object {
    try {
      if (typeof maybeFn === 'function') return maybeFn(data) || {};
      return {}
    } catch {
      return {};
    }

  }

  function paramFromMaybeFunction<T>(maybeFn: any, data: any, defaultValue: T): T {
    try {
      if (typeof maybeFn === 'function') return maybeFn(data) || defaultValue;
      return maybeFn as T;
    } catch {
      return defaultValue;
    }
  }

  const registry = useMemo<BehaviourHandlerRegistry>(
    () =>
      new Map([
        [
          'ServiceCallRequest',
          (action, event, data) => {
            const activity = action.eventData?.activity || action.eventData?.menu || action.eventData;
            const actionPath = activity?.action || '';
            const [namespace, activityName, version] = String(actionPath).split('/');
            if (!namespace || !activityName || !version) return;

            const payload = {
              ...activity.payload,
              ...objectFromMaybeFunction(activity.payloadFromnEvent, event),
              ...objectFromMaybeFunction(activity.payloadFromData, data),
              ...objectFromMaybeFunction(activity.payloadFromSession, sessionInfo),
            }


            const context = {
              ...activity.context,
              ...objectFromMaybeFunction(activity.contextFromEvent, event),
              ...objectFromMaybeFunction(activity.contextFromData, data),
              ...objectFromMaybeFunction(activity.contextFromSession, sessionInfo),
            }

            callActivity({ namespace, activityName, version, payload, context });
          },
        ],
        [
          'MenuRequest',
          (action, event) => {
            const menu = action.eventData?.menu || {};
            const requestType = action.eventData?.requestType;
            const menuId = menu.id || menu.menuId;
            if (!requestType || !menuId) return;

            dispatchMenu({
              contextOwnerId: action.contextOwnerId ?? 'global',
              requestType,
              menuId,
              label: menu.label,
              action: typeof menu.action === 'string' ? menu.action : undefined,
              enabled: typeof menu.disabled === 'boolean' ? !menu.disabled : undefined,
              hidden: typeof menu.hidden === 'boolean' ? menu.hidden : undefined,
              groupId: menu.groupId,
              menuTarget: menu.menuTarget,
              context: menu.context ?? event?.payload?.data ?? event?.payload?.context,
            });
          },
        ],
         [
          'NavTreeRequest',
          (action, event) => {
            const navItem = action.eventData?.navItem || {};
            const requestType = action.eventData?.requestType;
            const navItemId = navItem.id || navItem.navItemId;
            if (!requestType || !navItemId) return;

            dispatchNavTree({
              contextOwnerId: action.contextOwnerId ?? 'global',
              requestType,
              navItemId,
              label: navItem.label,
              action: typeof navItem.action === 'string' ? navItem.action : undefined,
              enabled: typeof navItem.disabled === 'boolean' ? !navItem.disabled : undefined,
              hidden: typeof navItem.hidden === 'boolean' ? navItem.hidden : undefined,
              groupId: navItem.groupId,
              navItemTarget: navItem.navItemTarget,
              context: navItem.context ?? event?.payload?.data ?? event?.payload?.context,
            });
          },
        ],
        [
          'PresentationRequest',
          (action, event) => {
            const requestType = action.eventData?.requestType;
            const target = action.eventData?.target;
            if (!requestType || !target) return;

            const params =
              typeof action.eventData?.paramsFromEvent === 'function'
                ? action.eventData.paramsFromEvent(event)
                : {}

            Object.entries(action.eventData.params || {}).forEach(([key, value]) => {
              params[key] = paramFromMaybeFunction(value, event, value);
            })

            params.content = action.eventData?.content;
            params.viewDataIdentifier =  event?.viewDataIdentifier 
              || action.eventData?.viewDataIdentifier; // the event is the preferred source for viewDataIdentifier,
              //  as it allows it to be dynamic based on the triggering event
              //  and action.eventData.viewDataIdentifier is replaced later 

            dispatchPresentation({ requestType, target, params, contextOwnerId: action.contextOwnerId ?? 'global' });
          },
        ],
        [
          'DataRequest',
          (action, _event, data) => {
            const requestType = action.eventData?.requestType;
            const viewDataIdentifier = action.eventData?.viewDataIndentifier;
            if (!requestType || !viewDataIdentifier) return;

            if (requestType === 'revert') {
              invalidate(viewDataIdentifier);
            } else {
              const nextData =
                typeof action.eventData?.changeFn === 'function'
                  ? action.eventData.changeFn(data)
                  : undefined;
              save(viewDataIdentifier, nextData);
            }
          },
        ],
        ['clearContextOwner', (action) => {
          const contextOwnerId = action.contextOwnerId;
          if (!contextOwnerId) return;

          dispatchMenu({ contextOwnerId, requestType: 'clearContextOwner' });
          dispatchNavTree({ contextOwnerId, requestType: 'clearContextOwner' });
          dispatchPresentation({ contextOwnerId, requestType: 'clearContextOwner' });
        }],
      ] as [string, ActionHandler][]),
      
    [callActivity, dispatchMenu, dispatchPresentation, invalidate, save],
  );

  return (
    <BehaviourHandlerRegistryContext.Provider value={registry}>
      {children}
    </BehaviourHandlerRegistryContext.Provider>
  );
}

// ── BehaviourHandlerRegistryProvider (sub-tree override) ─────────────────────

type OverrideProviderProps = {
  /** Additional or overriding handlers for this sub-tree. Merged on top of parent. */
  handlers: BehaviourHandlerRegistry;
  children: ReactNode;
};

/**
 * Wrap a sub-tree to extend or override the action handler registry.
 * Handlers provided here are merged on top of the parent registry,
 * so the parent's handlers remain available for any types not overridden.
 */
export function BehaviourHandlerRegistryProvider({ handlers, children }: OverrideProviderProps) {
  const parent = useContext(BehaviourHandlerRegistryContext);
  const merged = useMemo(() => new Map([...parent, ...handlers]), [parent, handlers]);
  return (
    <BehaviourHandlerRegistryContext.Provider value={merged}>
      {children}
    </BehaviourHandlerRegistryContext.Provider>
  );
}

export function useBehaviourHandlerRegistry(): BehaviourHandlerRegistry {
  return useContext(BehaviourHandlerRegistryContext);
}

