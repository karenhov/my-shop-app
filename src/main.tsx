import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
  const isLocalhost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (import.meta.env.PROD || isLocalhost) {
    // Եթե արդեն կար ակտիվ SW, նորը ակտիվանալիս էջը մեկ անգամ ավտոմատ թարմացնում ենք,
    // որ հին տարբերակը չմնա
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloaded) return;
      reloaded = true;
      window.location.reload();
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' }) // sw.js-ը երբեք չքեշել
        .then((registration) => registration.update()) // ամեն մուտքի ժամանակ ստուգել նոր տարբերակ
        .catch((error) => {
          console.error('Service worker registration failed:', error);
        });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
