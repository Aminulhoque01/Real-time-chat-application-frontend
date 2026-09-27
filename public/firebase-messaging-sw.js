// importScripts(
//   "https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js"
// );

// importScripts(
//   "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js"
// );

// firebase.initializeApp({
//    apiKey: "AIzaSyBnn_awNfAo4dKbkka0pnzpQj05tQfi6yA",
//   authDomain: "chat-application-a11de.firebaseapp.com",
//   projectId: "chat-application-a11de",
//   storageBucket: "chat-application-a11de.firebasestorage.app",
//   messagingSenderId: "1044114855507",
//   appId: "1:1044114855507:web:d70f336dd690f07d5898a6",
//   measurementId: "G-LS6PCKR76Y"
// });

// const messaging = firebase.messaging();

// messaging.onBackgroundMessage((payload) => {
//   console.log(
//     "[firebase-messaging-sw.js] Background message:",
//     payload
//   );

//   const notificationTitle =
//     payload.notification?.title || "New Message";

//   const notificationOptions = {
//     body:
//       payload.notification?.body ||
//       "You have a new message",

//     icon: "/icon-192.png",

//     data: payload.data || {},
//   };

//   self.registration.showNotification(
//     notificationTitle,
//     notificationOptions
//   );
// });



importScripts(
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js",
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
 apiKey: "AIzaSyBnn_awNfAo4dKbkka0pnzpQj05tQfi6yA",
  authDomain: "chat-application-a11de.firebaseapp.com",
   projectId: "chat-application-a11de",
   storageBucket: "chat-application-a11de.firebasestorage.app",
  messagingSenderId: "1044114855507",
  appId: "1:1044114855507:web:d70f336dd690f07d5898a6",
  measurementId: "G-LS6PCKR76Y"
 });
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Background message:",
    payload,
  );

  const title =
    payload.notification?.title || "New Message";

  const body =
    payload.notification?.body || "You have a new message";

  const notificationOptions = {
    body,
    icon: "/icon-192x192.png",
    data: payload.data || {},
    tag: payload.data?.messageId || "new-message",
  };

  self.registration.showNotification(
    title,
    notificationOptions,
  );
});