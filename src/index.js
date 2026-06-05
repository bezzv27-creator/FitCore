import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
// ===== PWA SETUP =====
// Aggancia manifest e icone (head non accessibile in questa struttura)
const head = document.head;

const manifestLink = document.createElement("link");
manifestLink.rel = "manifest";
manifestLink.href = "/manifest.json";
head.appendChild(manifestLink);

const themeMeta = document.createElement("meta");
themeMeta.name = "theme-color";
themeMeta.content = "#0d0d0f";
head.appendChild(themeMeta);

const appleIcon = document.createElement("link");
appleIcon.rel = "apple-touch-icon";
appleIcon.href = "/apple-touch-icon.png";
head.appendChild(appleIcon);

const appleCapable = document.createElement("meta");
appleCapable.name = "apple-mobile-web-app-capable";
appleCapable.content = "yes";
head.appendChild(appleCapable);

// Registra il service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch((err) => console.log("SW registration failed:", err));
  });
} 