import { createContext, ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';

const ReContext = createContext({
  rules: {} as Record<string, any>,
  // Add other properties as needed
});

function useReContext() {
  const context = useContext(ReContext);
  if (!context) {
    throw new Error('useReContext must be used within a ReProvider');
  }
return context;
}

function ReProvider({ children } : { children: ComponentChildren }) {


  return (
    <ReContext.Provider value={{
      rules: {}
     }}>
      {children}
    </ReContext.Provider>
  );
}
export { useReContext, ReProvider };