import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log("FANTASYSPORT: Iniciando montura...");

// PWA: Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW: Registrado', reg))
      .catch(err => console.log('SW: Error', err));
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error("Error crítico: No se encontró el elemento root");
}
