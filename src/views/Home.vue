<template>
  <div class="wrapper">
    <div class="chat-messages">
      <component
        v-for="(message, i) in messages"
        :is="getMessageComponent(message.userId)"
        :even="i % 2 === 0"
        :is-next-me="message.nextUserId === $store.state.user.id"
        :key="message.id"
        :text="message.text"
        :userPic="message.userPic"
        :is-last="!message.nextUserId"
      />
    </div>

    <!-- <div class="header">
      <div class="header-contents-right">
        <i
          class="fas fa-arrow-left clickable"
          @click="$router.push('/rooms')"
        ></i>
      </div>
      <div class="header-contents-left">
        <i class="fas fa-cog clickable" @click="$router.push('/rooms')"></i>
      </div>
    </div> -->

    <div class="footer-wrapper">
      <div class="footer">
        <div class="text">
          <textarea
            placeholder="Jot something down"
            v-model="message"
          ></textarea>
        </div>
        <div class="action">
          <button
            class="button is-primary"
            :class="{ 'is-loading': sendingMessage }"
            :disabled="message.length === 0"
            @click="publishMessage"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ChatMessage from "@/components/ChatMessage.vue";
import ChatMessageMine from "@/components/ChatMessageMine.vue";
import Repository from "@/repository";

function scrollToBottom() {
  const elem = document.documentElement;
  const bottom = elem.scrollHeight - elem.clientHeight;
  window.scroll(0, bottom);
}

export default {
  name: "Home",
  components: {
    ChatMessage,
    ChatMessageMine
  },
  props: {
    roomId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      message: "",
      sendingMessage: false
    };
  },
  computed: {
    messages() {
      return this.$store.state.messages;
    }
  },
  watch: {
    async messages() {
      await this.$nextTick();
      scrollToBottom();
    }
  },
  methods: {
    getMessageComponent(userId) {
      if (userId === this.$store.state.user.id) {
        return ChatMessageMine;
      } else {
        return ChatMessage;
      }
    },
    async publishMessage() {
      this.sendingMessage = true;

      try {
        await Repository.addMessage(this.roomId, {
          id: new Date().getTime().toString(),
          text: this.message,
          userId: this.$store.state.user.id,
          userPic: this.$store.state.user.userPic
        });
      } catch (error) {
        this.sendingMessage = false;
        throw new Error(error);
      }

      this.message = "";
      this.sendingMessage = false;
    }
  },
  created() {
    this.$store.commit("clearMessages");
  },
  async mounted() {
    await this.$store.dispatch("loadMessages", this.roomId);
  }
};
</script>

<style lang="scss" scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 8px;

  display: flex;

  background-color: #000304;
  color: #fff;
  opacity: 0.9;

  .header-contents-right {
    flex: 1;
  }
}

.wrapper {
  display: flex;
  justify-content: center;
}

.chat-messages {
  max-width: 400px;
  padding-bottom: calc(80px + 24px);
}

.footer-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;

  display: flex;
  justify-content: center;

  background-color: #000304;
  opacity: 0.9;
}

.footer {
  width: 400px;
  height: 60px;

  display: flex;
  align-items: center;

  .text {
    flex: 1;

    margin-right: 8px;

    textarea {
      resize: none;
      width: 100%;
      height: 25px;

      margin-left: 16px;
      margin-right: 16px;

      line-height: 25px;
      background-color: #000304;
      color: #fff;
      border: none;
      outline: none;
    }
  }
}
</style>
