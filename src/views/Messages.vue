<template>
  <div class="wrapper">
    <div class="chat-messages">
      <component
        v-for="message in messages"
        :is="getMessageComponent(message.userId)"
        :is-next-me="message.meta.isNextMyMessage"
        :key="message.id"
        :text="message.text"
        :created-at="message.createdAt"
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

// 何回メッセージの変更通知を受けたらハンドラを再取得するか
const REFRESH_COUNT = 5

let cache: MessagesCache
const photoUrlCache = new Map<string, string | null>()

function scrollToBottom() {
  const elem = document.documentElement
  const bottom = elem.scrollHeight - elem.clientHeight
  window.scroll(0, bottom)
}

/**
 * キャッシュされている最後のメッセージを取得する
 *
 * @throws キャッシュマネージャーが初期化されていない場合、エラーとなる
 */
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

/**
 * メッセージをキャッシュする
 *
 * 既にキャッシュされているメッセージは内容を上書きする
 * TODO もうキャッシュの内容が変わるようなことはないのでは？？
 */
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

/**
 * メッセージにメタデータを追加/設定する
 *
 * @see {@link ChatMessage} for metadata contents
 */
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

/**
 * メッセージ一覧
 *
 * 指定部屋IDのメッセージ一覧とメッセージ入力欄を表示する。
 */
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
      const lastCachedMessage = await getLastCachedMessage()
      lastCachedMessage
        ? await this.loadMessagesFrom(lastCachedMessage)
        : this.loadMessages()
      this.messageSubscribeCount = 0
    }
  }

  // ******************************************************
  // Lifecycle hooks
  // ******************************************************

  async mounted() {
    this.initCache()

    try {
      // 初期表示で早くなるようとりあえずキャッシュからメッセージをロードしてしまう
      const messagesFromCache = await this.fetchMessagesFromCache()
      this.setMessages(messagesFromCache)

      // この部分は後続の処理を待たずに描画させる
      await this.$nextTick()

      const lastCachedMessage =
        messagesFromCache.length > 0
          ? messagesFromCache.slice(-1)[0]
          : undefined

      lastCachedMessage
        ? await this.loadMessagesFrom(lastCachedMessage)
        : this.loadMessages()
    } catch (error) {
      alert('メッセージがロードできませんでした！部屋一覧に戻ります。')
      this.$router.push('/rooms')
      return
    }

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

    await Repository.saveUsersLastRoom(this.$store.state.user.id, this.roomId)
  }

  beforeDestroy() {
    this.unsubscribe()
    if (cache) cache.close()
  }

  // ******************************************************
  // Instance methods
  // ******************************************************

  initCache() {
    if (cache) cache.close()
    cache = new MessagesCache(this.roomId) // TODO cache this instance?
  }

  async fetchMessagesFromCache(): Promise<ChatMessage[]> {
    const messages = await cache.messages
      .orderBy('createdAt')
      .reverse()
      .limit(Repository.chatMessageLimit)
      .toArray()

    messages.reverse()

    return messages
  }

  setMessages(messages: ChatMessage[]) {
    addMetadataToMessages(messages, this.$store.state.user.id)
    this.messages = messages
  }

  /**
   * メッセージをリポジトリからロードする
   */
  loadMessages() {
    this.unsubscribe()

    this.unsubscribe = Repository.onMessagesChange(
      this.roomId,
      async messages => {
        await cacheMessages(messages)
        this.setMessages(messages)
      },
    )
  }

  /**
   * 指定のメッセージ以降のメッセージをリポジトリからロードする
   */
  async loadMessagesFrom(message: ChatMessage) {
    this.unsubscribe()

    this.unsubscribe = await Repository.onMessagesChangeFrom(
      this.roomId,
      message.id,
      async newMessages => {
        if (newMessages.length === 0) {
          return
        }

        // ちょっと横着して、新着メッセージをキャッシュしたあとに改めて
        // キャッシュから規定件数取得して洗い替えしている。
        // 一回に表示する件数はそんなに多くないから良いが、ちゃんと今のmessagesと
        // マージすることを考える。
        await cacheMessages(newMessages)

        const cachedMessages = await cache.messages
          .orderBy('createdAt')
          .reverse()
          .limit(Repository.chatMessageLimit)
          .toArray()

        cachedMessages.reverse()

        this.setMessages(cachedMessages)
      },
    )
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
  padding-top: var(--spacing-xlarge);
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
