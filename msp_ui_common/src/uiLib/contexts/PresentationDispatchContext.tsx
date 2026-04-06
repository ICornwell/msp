import { createContext, useContext, useState, type ReactNode } from 'react';
import { ViewDataIdentifier } from 'msp_common';

export type PresentationDispatchRequest = {
  requestType: 'openBlade' | 'closeBlade' | 'openTab' | 'closeTab' | 'navigate' | 'showModal' | 'hideModal';
  target: string;
  params?: any;
};

export type PresentationBladeState = {
  open: boolean;
  content?: any;
  title?: string;
  viewDataIdentifier?: ViewDataIdentifier;
};

export type PresentationDispatchType = {
  dispatch: (request: PresentationDispatchRequest) => void;
};

export type PresentationDispatchContextType = PresentationDispatchType
  & {bladeState: PresentationBladeState};

export const PresentationDispatchContext = createContext<PresentationDispatchContextType>({
  dispatch: () => {},
  bladeState: { open: false, content: undefined, viewDataIdentifier: undefined },
});

/**
 * Subsystem provider for presentation navigation.
 *
 * Publishes PresentationRequest UIEvents so Behaviours and shell components can
 * observe and react (e.g. open a Blade, switch tabs). Will be replaced with a
 * richer implementation that manages cross-feature navigation state directly.
 */
export function PresentationDispatchProvider({ children }: { children: ReactNode }) {
  const [bladeState, setBladeState] = useState<PresentationBladeState>({ open: false, content: undefined, viewDataIdentifier: undefined });

  const dispatch = 
    (request: PresentationDispatchRequest) => {
      switch (request.requestType) {
        case 'openBlade':
          setBladeState({ open: true, content: request.params?.content,
             viewDataIdentifier: request.params?.viewDataIdentifier,
             title: request.params?.title });
          break;
        case 'closeBlade':
          setBladeState({ open: false, content: undefined, viewDataIdentifier: undefined, title: undefined });
          break;
        // case 'openTab':
        // case 'closeTab':
        // case 'navigate':
        //   // For now, just raise a UIEvent and let the shell handle it. Eventually we want to manage this state here too.
        //   raiseUiEvent({ eventName: 'PresentationRequest', data: request });
        //   break;
      }
    }

  return (
    <PresentationDispatchContext.Provider value={{ dispatch, bladeState }}>
      {children}
    </PresentationDispatchContext.Provider>
  );
}

/**
 * Used exclusively by Behaviours (via BehaviourDispatchProvider) to
 * dispatch presentation requests. Not for use in leaf UI components.
 */
export function usePresentationDispatch(): PresentationDispatchType {
  const {dispatch} = useContext(PresentationDispatchContext);
  return { dispatch };
}



export function usePresentationBladeState(): PresentationBladeState {
  const { bladeState } = useContext(PresentationDispatchContext);
  return bladeState;
}
