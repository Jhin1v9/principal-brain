import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './styles.css';
import App from './App';

// data.js é carregado aqui (não no index.html) com ?v=<build> pra furar o
// cache de CDN/Cloudflare — sem isso o grafo ficava stale após cada sync.
declare const __ATLAS_BUILD__: string;

function loadAtlasData(): Promise<void> {
  if (window.ATLAS_DATA) return Promise.resolve();
  return new Promise(resolve => {
    const s = document.createElement('script');
    s.src = `./data.js?v=${__ATLAS_BUILD__}`;
    s.onload = () => resolve();
    s.onerror = () => resolve(); // sem data: App cai no emptyData
    document.head.appendChild(s);
  });
}

loadAtlasData().then(() => {
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
