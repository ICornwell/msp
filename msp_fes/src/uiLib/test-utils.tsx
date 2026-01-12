import React, { ReactNode, useEffect } from 'react';
import { render as tlRender, RenderResult } from '@testing-library/react';
import { act } from 'react'; // Import act from React instead of react-dom/test-utils
import { EngineComponentProvider } from './renderEngine/contexts/ReComponentsContext.js';
import { ReProvider } from './renderEngine/contexts/ReEngineContext.js';
import { UserSessionProvider } from './contexts/UserSessionContext.js';
import { UiContentProvider } from './contexts/UiContentContext.js';

// Create wrapper component for providers to use in tests
const AllTheProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <UserSessionProvider>
      <UiContentProvider>
        <ReProvider>
          <EngineComponentProvider>
            {children}
          </EngineComponentProvider>
        </ReProvider>
      </UiContentProvider>
    </UserSessionProvider>
  );
};

// Create a component that helps with async effects in tests
const AsyncEffectHelper: React.FC<{ onRender: () => void; children: ReactNode }> = ({ onRender, children }) => {
  useEffect(() => {
    onRender();
  }, [onRender]);

  return <>{children}</>;
};

/**
 * Custom render function that wraps testing-library's render with:
 * 1. act() for better timing emulation
 * 2. Common providers needed for most components
 */
export function render(
  ui: React.ReactElement,
  options: { 
    withProviders?: boolean, 
    onRender?: () => void,
    [key: string]: any
  } = {}
): RenderResult {
  const { withProviders = true, onRender, ...restOptions } = options;
  
  let result: RenderResult;

  // Use act() to make sure all state updates and effects are processed properly
  act(() => {
    if (withProviders) {
      // With providers
      if (onRender) {
        result = tlRender(
          <AllTheProviders>
            <AsyncEffectHelper onRender={onRender}>
              {ui}
            </AsyncEffectHelper>
          </AllTheProviders>,
          restOptions
        );
      } else {
        result = tlRender(<AllTheProviders>{ui}</AllTheProviders>, restOptions);
      }
    } else {
      // Without providers
      if (onRender) {
        result = tlRender(
          <AsyncEffectHelper onRender={onRender}>
            {ui}
          </AsyncEffectHelper>,
          restOptions
        );
      } else {
        result = tlRender(ui, restOptions);
      }
    }
  });

  return result!;
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { act };