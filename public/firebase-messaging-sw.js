// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
// eslint-disable-next-line
importScripts("https://www.gstatic.com/firebasejs/5.5.6/firebase-app.js");
// eslint-disable-next-line
importScripts("https://www.gstatic.com/firebasejs/5.5.6/firebase-messaging.js");
// eslint-disable-next-line
importScripts("https://www.gstatic.com/firebasejs/5.5.6/firebase-auth.js");

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
// eslint-disable-next-line
firebase.initializeApp({
  apiKey: '{{VUE_APP_API_KEY}}',
  authDomain: '{{VUE_APP_AUTH_DOMAIN}}',
  projectId: '{{VUE_APP_PROJECT_ID}}',
  messagingSenderId: '{{VUE_APP_MESSAGING_SENDER_ID}}',
})

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
// eslint-disable-next-line
const messaging = firebase.messaging();

self.addEventListener('notificationclick', function(e) {
  console.log('notoiction click', e.notification)

  const roomId = e.notification.data.roomId
  const messageId = e.notification.data.messageId

  // eslint-disable-next-line
  const unsubscribe = firebase.auth().onAuthStateChanged(function(user) {
    unsubscribe()
    if (user) {
      user
        .getIdToken()
        .then(function(token) {
          console.log('token', token.length)
          return fetch(
            'https://{{VUE_APP_REGION}}-{{VUE_APP_PROJECT_ID}}.cloudfunctions.net/receiveLikeRequest',
            {
              method: 'POST',
              headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                data: {
                  roomId: roomId,
                  messageId: messageId,
                },
              }),
            },
          )
        })
        .then(function() {
          console.log('success!!')
          self.registration.showNotification(
            e.notification.title + 'のメッセージにLike!をしました',
            {
              icon: e.notification.icon,
              badge: e.notification.badge,
              body: e.notification.body,
              tag: e.notification.tag,
            },
          )
        })
        .catch(function(err) {
          console.log('error', err)
        })
    } else {
      console.log('no user')
    }
  })
})
