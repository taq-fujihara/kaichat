import Vue, { VueConstructor } from "vue";
import * as firebase from "firebase/app";
import App from "./App.vue";
import "./registerServiceWorker";
import { auth, messaging } from "./firebaseApp";
import router from "./router";
import store from "./store";
import Repository from "./repository";

import "./assets/normalize.css";
import "./assets/variables.scss";
import "./assets/styles.scss";

import { User } from "./models/User";

Vue.config.productionTip = false;

function renderApp(component: VueConstructor<Vue>): void {
  new Vue({
    router,
    store,
    render: h => h(component)
  }).$mount("#app");
}

function initMessaging(messaging: firebase.messaging.Messaging) {
  messaging.usePublicVapidKey(process.env.VUE_APP_MESSAGING_PUBLIC_KEY);
  messaging.requestPermission().then(() => {
    messaging
      .getToken()
      .then(token => Repository.setToken(store.state.user.id, token));
  });
  messaging.onTokenRefresh(() => {
    messaging
      .getToken()
      .then(token => Repository.setToken(store.state.user.id, token));
  });
}

async function getUserData(user: User) {
  return await Repository.createUser(user);
}

auth.onAuthStateChanged(async user => {
  if (!user) {
    auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());
  } else {
    const userData = await getUserData({
      id: user.uid,
      name: "",
      userPic: user.photoURL,
      defaultRoom: null
    });

    initMessaging(messaging);

    store.commit("setUser", userData);

    renderApp(App);
  }
});
