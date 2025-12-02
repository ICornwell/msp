// src/emotion-setup.js
import React from 'react';

// Create a singleton cache that will be used throughout the application
export const emotionCache = createCache({ key: 'msp-emotion' });

// Create a wrapper component to ensure consistent context
export function EmotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider value={emotionCache}>
      {children}
    </CacheProvider>
  );
}