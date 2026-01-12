import React, { createContext, useContext, useRef, ReactNode } from 'react';
import { ComponentWrapper, DisplayMode } from '../components/ReComponentWrapper.js';

export type ComponentInstantiator<P> = (props: P) => React.ReactElement
export type CompomentInstantiatorOptions = { useFormControl?: boolean, isContainer?: boolean, isManagedForm?: boolean }
export type InstantiatorProps<P> = { options?: CompomentInstantiatorOptions, instantiator: ComponentInstantiator<P> }

const engineComponentContext = createContext({
  addComponent: (_component: ComponentWrapper<any>, _propsMapper?: (any) => any) => { },

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

  function getCompoundName(name: string, mode: string) {
    return `${name}___${mode}`;
  }

  function addComponent(component: ComponentWrapper<any>, propsMapper?: (any) => any) {
    if (!propsMapper) {
        propsMapper = (props: any) => { return { ...props }; };
      }
    if (!component.displayMode || component.displayMode === 'all') component.displayMode = ['editing', 'editable', 'readonly'];
    if (!Array.isArray(component.displayMode)) component.displayMode = [component.displayMode as DisplayMode];
    for (const mode of component.displayMode) {
      const name = getCompoundName(component.displayName, mode);
      components.current[name] = {
        options: {
          isContainer: component.acceptsChildren,
          isManagedForm: component.isManagedForm
        },
        instantiator: (props: any) => (<component.component {...propsMapper(props)} />)
      };
    }
  }

  function removeComponent(name: string) {
    delete components.current[name]
  }

  function getComponent(name: string, mode?: string) {
    const compoundName = getCompoundName(name, mode ?? 'editing');
    return components.current[compoundName] ?? outerContext?.getComponentInstantiator(compoundName);
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