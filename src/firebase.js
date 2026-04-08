import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAgy0oucryJtMLJeXa3ILXrUUHX5Hg3_Dc",
  authDomain: "queuify-7bf67.firebaseapp.com",
  projectId: "queuify-7bf67",
  storageBucket: "queuify-7bf67.firebasestorage.app",
  messagingSenderId: "428603243996",
  appId: "1:428603243996:web:79fa56c20a425def652319"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const currentToken = await getToken(messaging, {
        vapidKey: "BPeqOPQHJOOTC2awiKbuvoWMLZTzcLFE6w3e_GahTRBBHhO5dd-QECyKl5cdchqk4VEOWWGgBZbpi_Asp_6nok",
      });
      if (currentToken) {
        return currentToken;
      } else {
        console.log("No registration token available. Request permission to generate one.");
      }
    }
  } catch (err) {
    console.log("An error occurred while retrieving token. ", err);
  }
  return null;
};

export const onMessageListener = (callback) =>
  onMessage(messaging, (payload) => {
    callback(payload);
  });

export default app;
