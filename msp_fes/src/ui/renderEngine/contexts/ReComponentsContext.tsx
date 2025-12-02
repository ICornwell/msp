import React, { createContext, useContext, useRef, ReactNode } from 'react';
import { ComponentWrapper } from '../components/ReComponentWrapper.tsx';

export type ComponentInstantiator<P> = (props: P) => React.ReactElement
export type CompomentInstantiatorOptions = { useFormControl?: boolean, isContainer?: boolean, isManagedForm?: boolean }
export type InstantiatorProps<P> = { options?: CompomentInstantiatorOptions, instantiator: ComponentInstantiator<P> }

const engineComponentContext = createContext({
  addComponent: (_component: ComponentWrapper<any>,_propsMapper?: (any) => any) => { },

  removeComponent: (_name: string) => { },
  getComponentInstantiator: (_name: string) => ({} as InstantiatorProps<any>)
});

function useEngineComponentsContext() {
  const context = useContext(engineComponentContext);
  return context;
}

interface EngineComponentProviderProps {
  children: ReactNode;
}

function EngineComponentProvider({ children }: EngineComponentProviderProps) {
  const outerContext = useEngineComponentsContext()
  const components = useRef<{ [key: string]: InstantiatorProps<any> }>({});

  function addComponent(component: ComponentWrapper<any>, propsMapper?: (any) => any) {
    const name = component.displayName;
    if (!propsMapper) {
        propsMapper = (props: any) => { return { ...props }; };
    }
    components.current[name] = {
      options: {
        isContainer: component.acceptsChildren,
        isManagedForm: component.isManagedForm
      },
      
      instantiator: (props: any) => (<component.component {...propsMapper(props)} />)
    };
  }

  function removeComponent(name: string) {
    delete components.current[name]
  }

  function getComponent(name: string) {
    return components.current[name] ?? outerContext?.getComponentInstantiator(name);
  }

  return (
    <engineComponentContext.Provider value={{
      addComponent,
      removeComponent,
      getComponentInstantiator: getComponent,
    }}>
      {children}
    </engineComponentContext.Provider>
  );
}

export { useEngineComponentsContext, EngineComponentProvider };