import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return <div>msp_aws remote loaded</div>;
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
