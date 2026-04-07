importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAgy0oucryJtMLJeXa3ILXrUUHX5Hg3_Dc",
  authDomain: "queuify-7bf67.firebaseapp.com",
  projectId: "queuify-7bf67",
  storageBucket: "queuify-7bf67.firebasestorage.app",
  messagingSenderId: "428603243996",
  appId: "1:428603243996:web:79fa56c20a425def652319"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.data?.icon || '/logo192.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
