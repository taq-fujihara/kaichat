import Vue from "vue";
import Vuex from "vuex";
import Repository from "@/repository";
import ChatMessage from "@/models/ChatMessage";
import { User } from "@/models/User";

Vue.use(Vuex);

let unsubscribeMessages: () => void;

export default new Vuex.Store({
  state: {
    // TODO dummy user
    // ユーザーの画像は各メッセージに入れずに、ユーザーIDから取ろう
    user: {
      id: "",
      name: "",
      userPic: "",
      defaultRoom: ""
    },
    messages: new Array<ChatMessage>(),
    members: new Array<User>()
  },
  mutations: {
    setUser(state, { id, name, userPic, defaultRoom }) {
      state.user.id = id;
      state.user.name = name;
      state.user.userPic = userPic;
      state.user.defaultRoom = defaultRoom;
    },
    addMessages(state, messages: Array<ChatMessage>) {
      state.messages = [...state.messages, ...messages];
    },
    clearMessages(state) {
      state.messages = [];
    }
  },
  actions: {
    async loadMessages({ state }, roomId: string) {
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
      Repository.onMessagesChange(roomId, messages => {
        messages.reverse();

        // ガイド線のためのメタデータ補完
        messages.forEach((m, i, arr) => {
          const nextIndex = i + 1;
          if (arr.length > nextIndex) {
            const next = arr[nextIndex];
            m.nextUserId = next.userId;
          } else {
            m.isLast = true;
          }
        });

        state.messages = messages;
      });
    },
    async loadMembers({ state }, roomId: string) {
      state.members = await Repository.getRoomMembers(roomId);
    }
  },
  modules: {}
});
