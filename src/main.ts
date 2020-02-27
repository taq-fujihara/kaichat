import Vue, { VueConstructor } from "vue";
import * as firebase from "firebase/app";
import App from "./App.vue";
import "./registerServiceWorker";
import { auth } from "./firebaseApp";
import router from "./router";
import store from "./store";
import Repository from "./repository";

import "@/assets/normalize.css";
import { User } from "./models/User";

Vue.config.productionTip = false;

function renderApp(component: VueConstructor<Vue>): void {
  new Vue({
    router,
    store,
    render: h => h(component)
  }).$mount("#app");
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
    store.commit("setUser", userData);

    renderApp(App);
  }
});
