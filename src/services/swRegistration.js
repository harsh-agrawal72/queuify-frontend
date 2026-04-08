export const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        const swUrl = '/firebase-messaging-sw.js';
        navigator.serviceWorker
          .register(swUrl)
          .then((registration) => {
            console.log('✅ ServiceWorker registration successful with scope: ', registration.scope);
          })
          .catch((err) => {
            console.error('❌ ServiceWorker registration failed: ', err);
          });
      });
    }
  };
