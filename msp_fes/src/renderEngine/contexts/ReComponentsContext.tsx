import { createContext, ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';

const engineComponentContext = createContext({

});

function useEngineComponentsContext() {
  const context = useContext(engineComponentContext);
  if (!context) {
    throw new Error('useEngineContext must be used within a EngineProvider');
  }
  return context;
}

function EngineComponentProvider({ children } : { children: ComponentChildren }) {


  return (
    <engineComponentContext.Provider value={{ }}>
      {children}
    </engineComponentContext.Provider>
  );
}
export { useEngineComponentsContext, EngineComponentProvider };