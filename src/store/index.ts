import Vue from 'vue'
import Vuex from 'vuex'
import Repository from '@/repository'
import ChatMessage from '@/models/ChatMessage'
import { User } from '@/models/User'

Vue.use(Vuex)

let unsubscribeMessages: () => void

export default new Vuex.Store({
  state: {
    // TODO dummy user
    // ユーザーの画像は各メッセージに入れずに、ユーザーIDから取ろう
    user: {
      id: '',
      name: '',
      photoUrl: '',
      lastRoom: '',
    },
    messages: new Array<ChatMessage>(),
    members: new Array<User>(),
  },
  mutations: {
    setUser(state, { id, name, photoUrl, lastRoom }) {
      state.user.id = id
      state.user.name = name
      state.user.photoUrl = photoUrl
      state.user.lastRoom = lastRoom
    },
    addMessages(state, messages: Array<ChatMessage>) {
      state.messages = [...state.messages, ...messages]
    },
    clearMessages(state) {
      state.messages = []
    },
  },
  actions: {
    async loadMessages({ state }, roomId: string) {
      if (unsubscribeMessages) {
        unsubscribeMessages()
      }

      unsubscribeMessages = Repository.onMessagesChange(roomId, messages => {
        messages.reverse()

        // メタデータ補完
        messages.forEach((m, i, arr) => {
          const nextIndex = i + 1
          if (arr.length > nextIndex) {
            const next = arr[nextIndex]
            m.nextUserId = next.userId
          } else {
            m.isLast = true
          }
        })

        state.messages = messages
      })
    },
    async loadMembers({ state }, roomId: string) {
      const users = await Repository.getRoomMembers(roomId)
      // 自分を最後に
      const me = users.find(u => u.id === state.user.id)
      const usersButMe = users.filter(u => u.id !== state.user.id)
      usersButMe.sort()

      if (!me) {
        throw new Error()
      }

      state.members = [...usersButMe, me]
    },
    unsubscribeMessages() {
      if (unsubscribeMessages) {
        unsubscribeMessages()
      }
    },
  },
  modules: {},
})
