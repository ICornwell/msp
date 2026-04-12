import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useActivityDispatch } from '../contexts/ActivityDispatchContext.js';
import { useMenuDispatch } from '../contexts/MenuDispatchContext.js';
import { usePresentationDispatch } from '../contexts/PresentationDispatchContext.js';
import { useDataDispatch } from '../contexts/DataCacheContext.js';
import type { RequestAction } from './behaviourConfig.js';
import { useUserSession } from '../hooks/index.js';
import { SessionInfo } from '../contexts/UserSessionContext.js';
import { ViewDataIdentifier } from 'msp_common';

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
  const { invalidate, save } = useDataDispatch();

  function objectFromMaybeFunction(maybeFn: any, data: any): Object {
    try {
      if (typeof maybeFn === 'function') return maybeFn(data) || {};
      return {}
    } catch {
      return {};
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
          'PresentationRequest',
          (action, event) => {
            const requestType = action.eventData?.requestType;
            const target = action.eventData?.target;
            if (!requestType || !target) return;

            const params =
              typeof action.eventData?.paramsFromEvent === 'function'
                ? action.eventData.paramsFromEvent(event)
                : action.eventData?.params;

            params.content = action.eventData?.content;
            params.viewDataIdentifier = action.eventData?.viewDataIdentifier
             || event?.payload?.viewDataContent as ViewDataIdentifier;

            dispatchPresentation({ requestType, target, params });
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
      ]),
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

