import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useActivityDispatch } from '../contexts/ActivityDispatchContext.js';
import { useMenuDispatch } from '../contexts/MenuDispatchContext.js';
import { useNavTreeDispatch } from '../contexts/NavTreeDispatchContext.js';
import { usePresentationDispatch } from '../contexts/PresentationDispatchContext.js';
import { useDataDispatch } from '../contexts/DataCacheContext.js';
import type { RequestAction } from './behaviourConfig.js';
import { useDataCache, useUserSession } from '../hooks/index.js';
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
  const { loggedOut } = useUserSession({
    onLoggedIn: (sessionInfo: SessionInfo) => { setSessionInfo(sessionInfo); },
    onLoggedOut: () => { setSessionInfo(null); },
  });
  const { callActivity } = useActivityDispatch();
  const { dispatch: dispatchMenu } = useMenuDispatch();
  const { dispatch: dispatchPresentation } = usePresentationDispatch();
  const { dispatch: dispatchNavTree } = useNavTreeDispatch();
  const { invalidate, save, update } = useDataDispatch();

  const { queryDataByIdentifier, isLocked} = useDataCache()

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
          (action, eventWithDataCarrier, _data) => {
            const activity = action.eventData?.activity || action.eventData?.menu || action.eventData;
            const actionPath = activity?.action || '';
            const [namespace, activityName, version] = String(actionPath).split('/');
            if (!namespace || !activityName || !version) return;

            const payload = {
              ...activity.payload,
              ...objectFromMaybeFunction(activity.payloadFromEvent, eventWithDataCarrier.event),
              ...objectFromMaybeFunction(activity.payloadFromData, eventWithDataCarrier.data),
              ...objectFromMaybeFunction(activity.payloadFromSession, sessionInfo),
            }


            const context = {
              ...activity.context,
              ...objectFromMaybeFunction(activity.contextFromEvent, eventWithDataCarrier.event),
              ...objectFromMaybeFunction(activity.contextFromData, eventWithDataCarrier.data),
              ...objectFromMaybeFunction(activity.contextFromSession, sessionInfo),
            }

            callActivity({ namespace, activityName, version, payload, context });
          },
        ],
        [
          'MenuRequest',
          (action, eventWithDataCarrier) => {
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
              context: menu.context ?? eventWithDataCarrier?.event?.payload?.data ?? eventWithDataCarrier?.event?.payload?.context,
            });
          },
        ],
        [
          'NavTreeRequest',
          (action, eventWithDataCarrier) => {
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
              context: navItem.context ?? eventWithDataCarrier?.event?.payload?.data ?? eventWithDataCarrier?.event?.payload?.context,
            });
          },
        ],
        [
          'PresentationRequest',
          (action, eventWithDataCarrier) => {
            const requestType = action.eventData?.requestType;
            const target = action.eventData?.target;
            if (!requestType || !target) return;

            const params =
              typeof action.eventData?.paramsFromEvent === 'function'
                ? action.eventData.paramsFromEvent(eventWithDataCarrier.event)
                : {}

            Object.entries(action.eventData.params || {}).forEach(([key, value]) => {
              params[key] = paramFromMaybeFunction(value, eventWithDataCarrier, value);
            })

            params.content = action.eventData?.content;
            params.viewDataIdentifier = eventWithDataCarrier?.viewDataIdentifier
              || action.eventData?.viewDataIdentifier; // the event is the preferred source for viewDataIdentifier,
            //  as it allows it to be dynamic based on the triggering event
            //  and action.eventData.viewDataIdentifier is replaced later 

            dispatchPresentation({ requestType, target, params, contextOwnerId: action.contextOwnerId ?? 'global' });
          },
        ],
        ['DataRequest',
          (action, eventWithDataCarrier, data) => {
            const requestType = action.eventData?.requestType;
            const viewDataIdentifier =
              paramFromMaybeFunction(action.eventData?.viewDataIdentifier, eventWithDataCarrier, undefined)
              || action.eventData?.viewDataIndentifier;
            if (!requestType || !viewDataIdentifier) return;
          
            if (requestType === 'revert') {
              invalidate(viewDataIdentifier);
            } else if (requestType === 'toUpdateFromEventResult') {

              const result = eventWithDataCarrier?.event?.payload?.result;
              const mapResultToDataFromEvent = action.eventData?.mapResultToDataFromEvent;
              const mapVid = mapResultToDataFromEvent?.viewDataIdentifier || action.eventData?.viewDataIdentifier;
              const vid = paramFromMaybeFunction(mapVid, eventWithDataCarrier, undefined);
              if (!vid || isLocked(vid)) return;
              const dataForUpdate = queryDataByIdentifier(vid);
              if (!dataForUpdate) return;
              const patch = typeof mapResultToDataFromEvent === 'function'
                ? mapResultToDataFromEvent(result, dataForUpdate)
                : undefined;
              if (patch && typeof patch === 'object') {
                update(vid, patch, eventWithDataCarrier.event.correlationId);
              }
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
        ['SystemRequest', (action) => {
          const requestType = action.eventData?.requestType;
          if (!requestType) return;

          if (requestType === 'logoutUser') {
            loggedOut();
            setSessionInfo(null);
          }
        }],
      ] as [string, ActionHandler][]),

    [callActivity, dispatchMenu, dispatchPresentation, invalidate, save, update],
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

