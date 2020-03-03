<template>
  <div class="wrapper">
    <div class="chat-messages">
      <component
        v-for="message in messages"
        :is="getMessageComponent(message.userId)"
        :is-next-me="message.meta.isNextMyMessage"
        :key="message.id"
        :text="message.text"
        :photoUrl="findPhotoUrl(message.userId)"
      />
    </div>

    <div class="header">
      <div class="header-contents-right">
        <i
          class="fas fa-arrow-left fa-lg clickable"
          @click="$router.push('/rooms')"
        ></i>
      </div>
      <div class="header-contents-left">
        <div class="avatars">
          <div class="avatars__shadow"></div>
          <Avatar
            v-for="user in members"
            :key="user.id"
            :photo-url="user.photoUrl"
            :is-small="true"
          />
        </div>
        <div>
          <i
            class="fas fa-cog clickable fa-lg"
            @click="$router.push(`/rooms/${roomId}`)"
          ></i>
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

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import Avatar from '@/components/Avatar.vue'
import ChatMessageComponent from '@/components/ChatMessage.vue'
import ChatMessageMine from '@/components/ChatMessageMine.vue'
import Repository from '@/repository'
import { MessagesCache } from '@/repository/MessagesCache'
import { User } from '@/models/User'
import ChatMessage from '@/models/ChatMessage'

const REFRESH_COUNT = 5

let cache: MessagesCache
const photoUrlCache = new Map<string, string | null>()

function scrollToBottom() {
  const elem = document.documentElement
  const bottom = elem.scrollHeight - elem.clientHeight
  window.scroll(0, bottom)
}

async function getLastCachedMessage() {
  if (!cache) {
    throw new Error('cache is not activated yet')
  }
  const m = await cache.messages
    .orderBy('createdAt')
    .reverse()
    .limit(1)
    .toArray()

  return m.length > 0 ? m[0] : undefined
}

async function cacheMessages(messages: ChatMessage[]) {
  let cachedCount = 0
  for (const message of messages) {
    if (await cache.messages.get(message.id)) {
      // already cached
      await cache.messages.put(message)
    } else {
      await cache.messages.add(message)
      cachedCount++
    }
  }
  return cachedCount
}

function addMetadataToMessages(messages: ChatMessage[], me: string): void {
  messages.forEach((m, i, arr) => {
    m.meta = {
      isNextMyMessage: false,
    }
    const nextIndex = i + 1
    if (arr.length > nextIndex) {
      const next = arr[nextIndex]
      m.meta.isNextMyMessage = next.userId === me
    }
  })
}

function existsNewMessage(
  currentMessages: ChatMessage[],
  newMessages: ChatMessage[],
): boolean {
  const currentLastMessageId = currentMessages[currentMessages.length - 1]?.id
  const lastMessageId = newMessages[newMessages.length - 1]?.id

  if (currentLastMessageId === undefined && lastMessageId === undefined) {
    return false
  }

  return currentLastMessageId !== lastMessageId
}

@Component({
  components: { Avatar, ChatMessageComponent, ChatMessageMine },
})
export default class Messages extends Vue {
  @Prop({ type: String, required: true }) roomId!: string

  private message = ''
  private sendingMessage = false
  private members = new Array<User>()
  private messages = new Array<ChatMessage>()
  private unsubscribe = () => {
    // do nothing
  }
  private messageSubscribeCount = 0

  @Watch('messages')
  async onMessage() {
    await this.$nextTick()
    scrollToBottom()

    this.messageSubscribeCount += 1
    if (this.messageSubscribeCount > REFRESH_COUNT) {
      await this.loadMessages()
      this.messageSubscribeCount = 0
    }
  }

  // ******************************************************
  // Lifecycle hooks
  // ******************************************************

  async mounted() {
    try {
      const users = await Repository.getRoomMembers(this.roomId)
      // 自分を最後に
      const me = users.find(u => u.id === this.$store.state.user.id)
      const usersButMe = users.filter(u => u.id !== this.$store.state.user.id)
      usersButMe.sort()

      if (!me) {
        throw new Error()
      }

      this.members = [...usersButMe, me]
    } catch (error) {
      alert('メンバーがロードできませんでした！部屋一覧に戻ります。')
      this.$router.push('/rooms')
      return
    }

    try {
      await this.loadMessages()
    } catch (error) {
      alert('メッセージがロードできませんでした！部屋一覧に戻ります。')
      this.$router.push('/rooms')
      return
    }

    await Repository.saveUsersLastRoom(this.$store.state.user.id, this.roomId)
  }

  beforeDestroy() {
    this.unsubscribe()
    if (cache) cache.close()
  }

  // ******************************************************
  // Instance methods
  // ******************************************************

  async loadMessages() {
    this.unsubscribe()
    if (cache) cache.close()

    cache = new MessagesCache(this.roomId) // TODO cache this instance?

    const lastCachedMessage = await getLastCachedMessage()
    if (lastCachedMessage) {
      this.unsubscribe = await Repository.onMessagesChangeFrom(
        this.roomId,
        lastCachedMessage.id,
        async newMessages => {
          newMessages.reverse()

          await cacheMessages(newMessages)

          const cachedMessages = await cache.messages
            .orderBy('createdAt')
            .reverse()
            .limit(Repository.chatMessageLimit)
            .toArray()
          cachedMessages.reverse()

          if (!existsNewMessage(this.messages, cachedMessages)) {
            // 現在表示している最後のメッセージと、新しいメッセージ一覧の最後が
            // 一致しているならば特に何も変わっていないはずなので更新処理はスキップ。
            // 実際、メッセージドキュメントが追加された時点で更新が検知されるが、
            // メッセージの作成日時にサーバータイムスタンプを使っているので、
            // サーバータイムスタンプが付与された時点でもう一度更新が検知されてしまう。
            return
          }

          addMetadataToMessages(cachedMessages, this.$store.state.user.id)
          this.messages = cachedMessages
        },
      )
    } else {
      this.unsubscribe = Repository.onMessagesChange(
        this.roomId,
        async messages => {
          messages.reverse()

          if (!existsNewMessage(this.messages, messages)) {
            // 現在表示している最後のメッセージと、新しいメッセージ一覧の最後が
            // 一致しているならば特に何も変わっていないはずなので更新処理はスキップ。
            // 実際、メッセージドキュメントが追加された時点で更新が検知されるが、
            // メッセージの作成日時にサーバータイムスタンプを使っているので、
            // サーバータイムスタンプが付与された時点でもう一度更新が検知されてしまう。
            return
          }

          await cacheMessages(messages)
          addMetadataToMessages(messages, this.$store.state.user.id)

          this.messages = messages
        },
      )
    }
  }

  getMessageComponent(userId: string) {
    if (userId === this.$store.state.user.id) {
      return ChatMessageMine
    } else {
      return ChatMessageComponent
    }
  }

  findPhotoUrl(userId: string) {
    const cache = photoUrlCache.get(userId)
    if (cache) {
      return cache
    }
    const users: User[] = this.members
    const user = users.find(m => m.id === userId)
    if (!user) {
      return undefined
    }
    photoUrlCache.set(userId, user.photoUrl)
    return user.photoUrl
  }

  async publishMessage() {
    if (!this.message) {
      return
    }

    this.sendingMessage = true

    try {
      await Repository.addMessage(
        this.roomId,
        this.$store.state.user.id,
        this.message,
      )
    } catch (error) {
      this.sendingMessage = false
      throw new Error(error)
    }

    this.message = ''
    this.sendingMessage = false
  }

  keyEnter(e: KeyboardEvent) {
    if (e.shiftKey) {
      this.publishMessage()
    }
  }
}
</script>

<style lang="scss" scoped>
$footer-height: 60px;
$contents-width: 390px;

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

    background-color: var(--color-app-black);
  }
}

.wrapper {
  display: flex;
  justify-content: center;
}

.chat-messages {
  width: 100%;
  max-width: $contents-width;
  padding-top: var(--spacing-large);
  padding-bottom: calc(80px + 24px);
}

.footer-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;

  display: flex;
  justify-content: center;

  background-color: var(--color-app-black);
  opacity: 0.9;
}

.footer {
  width: 100%;
  max-width: $contents-width;
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
      background-color: var(--color-app-black);
      color: #fff;
      border: none;
      outline: none;
    }
  }
}
</style>
