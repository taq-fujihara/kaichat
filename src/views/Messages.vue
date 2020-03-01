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
        :photoUrl="message.photoUrl"
        :is-last="!message.nextUserId"
      />
    </div>

    <div class="header">
      <div class="header-contents-right">
        <i
          class="fas fa-arrow-left clickable"
          @click="$router.push('/rooms')"
        ></i>
      </div>
      <div class="header-contents-left">
        <div class="avatars">
          <div class="avatars__shadow"></div>
          <Avatar
            v-for="user in $store.state.members"
            :key="user.id"
            :photo-url="user.photoUrl"
            :is-small="true"
          />
        </div>
      </div>
    </div>

    <div class="footer-wrapper">
      <div class="footer">
        <div class="text">
          <textarea
            placeholder="Jot something down"
            v-model="message"
            @keydown.enter="keyEnter"
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
import Avatar from '@/components/Avatar.vue'
import ChatMessage from '@/components/ChatMessage.vue'
import ChatMessageMine from '@/components/ChatMessageMine.vue'
import Repository from '@/repository'

function scrollToBottom() {
  const elem = document.documentElement
  const bottom = elem.scrollHeight - elem.clientHeight
  window.scroll(0, bottom)
}

export default {
  name: 'Messages',
  components: {
    ChatMessage,
    ChatMessageMine,
    Avatar,
  },
  props: {
    roomId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      message: '',
      sendingMessage: false,
    }
  },
  computed: {
    messages() {
      return this.$store.state.messages
    },
  },
  watch: {
    async messages() {
      await this.$nextTick()
      scrollToBottom()
    },
  },
  methods: {
    getMessageComponent(userId) {
      if (userId === this.$store.state.user.id) {
        return ChatMessageMine
      } else {
        return ChatMessage
      }
    },
    async publishMessage() {
      if (!this.message) {
        return
      }

      this.sendingMessage = true

      try {
        await Repository.addMessage(this.roomId, {
          id: new Date().getTime().toString(),
          text: this.message,
          userId: this.$store.state.user.id,
          photoUrl: this.$store.state.user.photoUrl,
        })
      } catch (error) {
        this.sendingMessage = false
        throw new Error(error)
      }

      this.message = ''
      this.sendingMessage = false
    },
    keyEnter(e) {
      if (e.shiftKey) {
        this.publishMessage()
      }
    },
  },
  created() {
    this.$store.commit('clearMessages')
  },
  async mounted() {
    await this.$store.dispatch('loadMessages', this.roomId)
    await this.$store.dispatch('loadMembers', this.roomId)
    await Repository.saveUsersLastRoom(this.$store.state.user.id, this.roomId)
  },
  beforeDestroy() {
    this.$store.dispatch('unsubscribeMessages')
  },
}
</script>

<style lang="scss" scoped>
$bg-color: #000304;
$footer-height: 60px;

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 8px;

  display: flex;

  color: #fff;
  opacity: 0.9;

  .header-contents-right {
    flex: 1;
  }

  .header-contents-left {
    display: flex;
  }
}

.avatars {
  position: relative;
  display: flex;

  &__shadow {
    position: absolute;
    top: 10%;
    bottom: -10px;
    left: -10px;
    right: 5px;
    clip-path: polygon(
      45% 45%,
      50% 75%,
      100% 0,
      100% 80%,
      35% 100%,
      35% 83%,
      0 100%
    );

    background-color: $bg-color;
  }
}

.wrapper {
  display: flex;
  justify-content: center;
}

.chat-messages {
  width: 400px;
  padding-bottom: calc(80px + 24px);
}

.footer-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;

  display: flex;
  justify-content: center;

  background-color: $bg-color;
  opacity: 0.9;
}

.footer {
  width: 400px;
  height: $footer-height;

  display: flex;
  align-items: center;

  .text {
    flex: 1;

    margin-right: 8px;

    textarea {
      resize: none;
      width: 100%;
      height: 25px;

      margin-left: var(--spacing-medium);
      margin-right: var(--spacing-medium);

      line-height: 25px;
      background-color: $bg-color;
      color: #fff;
      border: none;
      outline: none;
    }
  }
}
</style>
