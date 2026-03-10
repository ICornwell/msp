import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return <div>Actorwork remote loaded</div>;
}

const rootElement = document.getElementById('app');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
