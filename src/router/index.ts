import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import Rooms from "../views/Rooms.vue";
import store from "@/store";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home"
    // redirect: { name: "Messages" }
  },
  {
    path: "/rooms",
    name: "Rooms",
    component: Rooms
  },
  {
    path: "/rooms/:roomId/messages",
    name: "Messages",
    component: Home,
    props: true
  },
  {
    path: "/about",
    name: "About",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/About.vue")
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

router.beforeEach((to, from, next) => {
  if (to.name === "Home") {
    next({
      name: "Messages",
      params: {
        roomId: store.state.user.defaultRoom
      }
    });

    return;
  }

  next();
});

export default router;
