import React, { createContext, useContext, useRef, ReactNode } from 'react';
import { ReUiPlanElement } from '../UiPlan/ReUiPlan';
import { ReComponentWrapperProps } from '../components/ReComponentProps';

export type ComponentInstantiator = (props: ReComponentWrapperProps) => React.ReactElement
export type CompomentInstantiatorOptions = { useFormControl?: boolean, isContainer?: boolean, isManagedForm?: boolean }
export type InstantiatorProps = { options?: CompomentInstantiatorOptions, instantiator: ComponentInstantiator }

const engineComponentContext = createContext({
  addComponent: (_name: string, _componentInstantiator: ComponentInstantiator) => { },
  addManagedFormComponent: (_name: string, _componentInstantiator: ComponentInstantiator) => { },
  addContainerComponent: (_name: string, _componentInstantiator: ComponentInstantiator) => { },
  removeComponent: (_name: string) => { },
  getComponentInstantiator: (_name: string) => ({} as InstantiatorProps)
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
  const components = useRef<{ [key: string]: InstantiatorProps}>({});

  function addComponent(name: string, instantitator: ComponentInstantiator) {
    components.current[name] = {options: {isContainer: false, isManagedForm: false}, instantiator: instantitator};
  }

  function addManagedFormComponent(name: string, instantitator: ComponentInstantiator) {
    components.current[name] = {options: {isContainer: false, isManagedForm: true}, instantiator: instantitator};
  }

  function addContainerComponent(name: string, instantitator: ComponentInstantiator) {
    components.current[name] = {options: {isContainer: true, isManagedForm: false}, instantiator: instantitator};
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
      addContainerComponent,
      addManagedFormComponent,
      removeComponent,
      getComponentInstantiator: getComponent,
     }}>
      {children}
    </engineComponentContext.Provider>
  );
}

export { useEngineComponentsContext, EngineComponentProvider };