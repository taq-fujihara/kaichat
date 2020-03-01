// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
// eslint-disable-next-line
importScripts("https://www.gstatic.com/firebasejs/5.5.6/firebase-app.js");
// eslint-disable-next-line
importScripts("https://www.gstatic.com/firebasejs/5.5.6/firebase-messaging.js");

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
// eslint-disable-next-line
firebase.initializeApp({
  messagingSenderId: '{{VUE_APP_MESSAGING_SENDER_ID}}',
})

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
// eslint-disable-next-line
const messaging = firebase.messaging();

// messaging.setBackgroundMessageHandler(function(payload) {
//   const notificationTitle = payload.data.title;
//   const notificationOptions = {
//     body: payload.data.body,
//     icon: payload.data.icon,
//     data: {
//       url: payload.data.url
//     }
//   };

//   return self.registration.showNotification(
//     notificationTitle,
//     notificationOptions
//   );
// });
