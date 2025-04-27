import { createContext, ComponentChildren, JSX } from 'preact';
import { useContext, useRef } from 'preact/hooks';
import { ReUiPlanElement } from '../UiPlan/ReUiPlan';

export type ComponentInstantiator = (elementOptions: ReUiPlanElement) => JSX.Element


const engineComponentContext = createContext({
  addComponent: (_name: string, _componentInstantiator: ComponentInstantiator) => { },
  removeComponent: (_name: string) => { },
  getComponentInstantiator: (_name: string) => (()=>{}) as Function
});

function useEngineComponentsContext() {
  const context = useContext(engineComponentContext);

  return context;
}

function EngineComponentProvider({ children } : { children: ComponentChildren }) {
  const outerContext = useEngineComponentsContext()
  const components = useRef<{ [key: string]: Function }>({});

  function addComponent(name: string, componentInstantiator: ComponentInstantiator) {
    components.current[name] = componentInstantiator;
  }
  function removeComponent(name: string) {
    delete components.current[name]
  }
  function getComponent(name: string) {
    return components.current[name] ?? outerContext?.getComponentInstantiator(name);
  }

  return (
    <engineComponentContext.Provider value={{
      addComponent: addComponent,
      removeComponent: removeComponent,
      getComponentInstantiator: getComponent,
     }}>
      {children}
    </engineComponentContext.Provider>
  );
}
export { useEngineComponentsContext, EngineComponentProvider };