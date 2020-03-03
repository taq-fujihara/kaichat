import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: {
      id: '',
      name: '',
      photoUrl: '',
      lastRoom: '',
    },
  },
  mutations: {
    setUser(state, { id, name, photoUrl, lastRoom }) {
      state.user.id = id
      state.user.name = name
      state.user.photoUrl = photoUrl
      state.user.lastRoom = lastRoom
    },
  },
  actions: {},
  modules: {},
})
