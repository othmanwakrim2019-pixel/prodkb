import './i18n';
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Auto-reload when a Vite lazy-loaded chunk fails to load.
// This happens after a Docker rebuild — the browser has stale chunk hashes.
// The reload fetches the new index.html with updated chunk references.
window.addEventListener('vite:preloadError', () => {
    window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
