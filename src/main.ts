import Vue, { VueConstructor } from 'vue'

import App from './App.vue'
import './registerServiceWorker'
import * as firebase from 'firebase/app'
import { auth, messaging } from './firebaseApp'
import router from './router'
import store from './store'
import Repository from './repository'
import { fromCache, cache, clear } from './repository/UserCache'
// App common components
import AppHeader from './components/AppHeader.vue'
import AppButton from './components/AppButton.vue'
import AppInput from './components/AppInput.vue'
import AppLink from './components/AppLink.vue'

import './assets/normalize.css'
import './assets/variables.scss'
import './assets/styles.scss'

Vue.config.productionTip = false

Vue.component('app-header', AppHeader)
Vue.component('app-button', AppButton)
Vue.component('app-input', AppInput)
Vue.component('app-link', AppLink)

let app: Vue

function renderApp(component: VueConstructor<Vue>): Vue {
  return new Vue({
    router,
    store,
    render: h => h(component),
  }).$mount('#app')
}

function initMessaging(
  messaging: firebase.messaging.Messaging,
  userId: string,
) {
  if (process.env.VUE_APP_MESSAGING_PUBLIC_KEY) {
    messaging.usePublicVapidKey(process.env.VUE_APP_MESSAGING_PUBLIC_KEY)
  }
  messaging.requestPermission().then(() => {
    messaging.getToken().then(token => Repository.setToken(userId, token))
  })
  messaging.onTokenRefresh(() => {
    messaging.getToken().then(token => Repository.setToken(userId, token))
  })
}

auth.onAuthStateChanged(async user => {
  if (!user) {
    auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider())
  } else {
    initMessaging(messaging, user.uid)

    const userCache = await fromCache()

    if (userCache) {
      if (user.uid === userCache.id) {
        // すぐ画面表示に移行するため、最終ログインユーザーのキャッシュがあれば
        // 描画に入る。ただし、まだ色々やることがあるのでここで処理を止めてはダメ。
        store.commit('setUser', userCache)
        app = renderApp(App)
      } else {
        await clear()
      }
    }

    // キャッシュされている最終ログインユーザー情報から変更されている可能性が
    // あるので、サーバーデータを取得して上書きしておく。
    // キャッシュと同一であったら何も起きないのでとりあえず保存。
    const userDoc = await Repository.getUser(user.uid)
    if (userDoc) {
      cache(userDoc)
      store.commit('setUser', userDoc)
    } else {
      // キャッシュもなし、サーバーにデータもなし => 初ログインなので
      // サーバーデータを作成する必要がある（ついでにキャッシュも）
      const newUser = {
        id: user.uid,
        name: user.displayName || '',
        photoUrl: user.photoURL,
        lastRoom: null,
      }
      await Repository.createUser(newUser)
      cache(newUser)
    }

    if (!app) {
      app = renderApp(App)
    }
  }
})
