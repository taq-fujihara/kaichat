import Vue, { VueConstructor } from 'vue'
import * as firebase from 'firebase/app'
import App from './App.vue'
import './registerServiceWorker'
import { auth, messaging } from './firebaseApp'
import router from './router'
import store from './store'
import Repository from './repository'

import './assets/normalize.css'
import './assets/variables.scss'
import './assets/styles.scss'

Vue.config.productionTip = false

function renderApp(component: VueConstructor<Vue>): void {
  new Vue({
    router,
    store,
    render: h => h(component),
  }).$mount('#app')
}

function initMessaging(messaging: firebase.messaging.Messaging) {
  messaging.usePublicVapidKey(process.env.VUE_APP_MESSAGING_PUBLIC_KEY)
  messaging.requestPermission().then(() => {
    messaging
      .getToken()
      .then(token => Repository.setToken(store.state.user.id, token))
  })
  messaging.onTokenRefresh(() => {
    messaging
      .getToken()
      .then(token => Repository.setToken(store.state.user.id, token))
  })
}

auth.onAuthStateChanged(async user => {
  if (!user) {
    auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider())
  } else {
    const userDoc = await Repository.getUser({
      id: user.uid,
      name: '',
      photoUrl: user.photoURL,
      lastRoom: null,
    })

    initMessaging(messaging)

    store.commit('setUser', userDoc)

    renderApp(App)
  }
})
