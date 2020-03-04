import Vue from 'vue'
import VueRouter from 'vue-router'
import Rooms from '../views/Rooms.vue'
import Room from '../views/Room.vue'
import Messages from '../views/Messages.vue'
import Settings from '../views/Settings.vue'
import store from '@/store'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
  },
  {
    path: '/rooms',
    name: 'Rooms',
    component: Rooms,
  },
  {
    path: '/rooms/:roomId',
    name: 'Room',
    component: Room,
    props: true,
  },
  {
    path: '/rooms/:roomId/messages',
    name: 'Messages',
    component: Messages,
    props: true,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ '../views/About.vue'),
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.name === 'Home') {
    if (store.state.user.lastRoom) {
      next({
        name: 'Messages',
        params: {
          roomId: store.state.user.lastRoom,
        },
      })
    } else {
      next({
        name: 'Rooms',
      })
    }

    return
  }

  next()
})

export default router
