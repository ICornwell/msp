import React, { createContext, useContext, ReactNode } from 'react';

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

interface ReProviderProps {
  children: ReactNode;
}

function ReProvider({ children }: ReProviderProps) {
  return (
    <ReContext.Provider value={{
      rules: {}
     }}>
      {children}
    </ReContext.Provider>
  );
}
export { useReContext, ReProvider };