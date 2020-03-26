<template>
  <div class="wrapper">
    <div class="chat-messages">
      <component
        v-for="message in messages"
        :is="getMessageComponent(message.userId)"
        :is-next-me="message.meta.isNextMyMessage"
        :key="message.id"
        :text="message.text"
        :users-read-this-message="message.meta.usersReadThisMessage"
        :created-at="message.createdAt"
        :photoUrl="findPhotoUrl(message.userId)"
      />
    </div>

    <div class="header">
      <div class="header__contents header__contents--right">
        <i
          class="fas fa-arrow-left fa-lg clickable"
          @click="$router.push('/rooms')"
        />
        <div class="header__avatars">
          <Avatar
            v-for="user in members"
            :key="user.id"
            :photo-url="user.photoUrl"
            :is-small="true"
          />
        </div>
      </div>
      <div class="header__contents header__contents--left">
        <i
          class="fas fa-cog clickable fa-lg"
          @click="$router.push(`/rooms/${roomId}`)"
        />
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
          <app-button
            class="button is-primary"
            :class="{ 'is-loading': sendingMessage }"
            :disabled="message.length === 0"
            @click="publishMessage"
          >
            Send
          </app-button>
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
let readCache: { userId: string; messageId: string } | undefined

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
function addMetadataToMessages(
  messages: ChatMessage[],
  read: { user: User; messageId: string }[],
  me: string,
): void {
  const map = new Map<string, User[]>()
  for (const r of read) {
    const users = map.get(r.messageId) || []
    users.push(r.user)
    map.set(r.messageId, users)
  }

  messages.forEach((m, i, arr) => {
    m.meta = {
      isNextMyMessage: false,
      usersReadThisMessage: map.get(m.id) || [],
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

  // 送信メッセージ
  private message = ''

  // メッセージ送信中フラグ
  private sendingMessage = false

  // 部屋メンバー
  private members = new Array<User>()

  private read = new Array<{ user: User; messageId: string }>()

  // 表示メッセージ
  private messages = new Array<ChatMessage>()

  // メッセージ監視をやめる
  private unsubscribeMessages = () => {
    // do nothing
  }

  // 部屋情報監視をやめる
  private unsubscribeSomeoneRead = () => {
    // do nothing
  }

  // 新着メッセージ更新回数
  // 常に最新xx件の受信をするのではなく、定期敵に監視個数を減らす。
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

  created() {
    this.initCache()
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
  }

  async mounted() {
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
      const usersButMe = users.filter(u => u.id !== this.$store.state.user.id)
      usersButMe.sort()
      this.members = usersButMe
    } catch (error) {
      alert('メンバーがロードできませんでした！部屋一覧に戻ります。')
      this.$router.push('/rooms')
      return
    }

    this.unsubscribeSomeoneRead = Repository.onSomeoneReadMessage(
      this.roomId,
      this.$store.state.user.id,
      read => {
        this.read = read.map(
          r =>
            ({
              user: this.members.find(m => m.id === r.userId),
              messageId: r.messageId,
            } as { user: User; messageId: string }),
        )
        this.setMessages(this.messages)
      },
    )

    await Repository.saveUsersLastRoom(this.$store.state.user.id, this.roomId)
  }

  beforeDestroy() {
    this.unsubscribeMessages()
    this.unsubscribeSomeoneRead()
    readCache = undefined
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange,
    )
    if (cache) cache.close()
  }

  // ******************************************************
  // Instance methods
  // ******************************************************

  initCache() {
    if (cache) cache.close()
    cache = new MessagesCache(this.roomId) // TODO cache this instance?
  }

  /**
   * ブラウザ/タブの表示非表示切替時処理
   */
  async handleVisibilityChange() {
    if (document.hidden) {
      return
    }
    if (!readCache) {
      return
    }

    // hidden -> visible のタイミングで、既読更新キャッシュが残っていたら更新する
    await this.updateReadUntil(readCache.messageId)
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
    addMetadataToMessages(messages, this.read, this.$store.state.user.id)
    this.messages = messages
  }

  /**
   * 自身の既読メッセージを更新する
   */
  async updateReadUntil(messageId: string) {
    await Repository.updateReadUntil(
      this.roomId,
      this.$store.state.user.id,
      messageId,
    )
  }

  /**
   * メッセージをリポジトリからロードする
   */
  loadMessages() {
    this.unsubscribeMessages()

    this.unsubscribeMessages = Repository.onMessagesChange(
      this.roomId,
      async messages => {
        await cacheMessages(messages)
        this.setMessages(messages)

        // 既読処理
        if (messages.length === 0) {
          return
        }
        const message = messages.slice(-1)[0]
        if (document.hidden) {
          readCache = {
            userId: this.$store.state.user.id,
            messageId: message.id,
          }
        } else {
          await this.updateReadUntil(message.id)
        }
      },
    )
  }

  /**
   * 指定のメッセージ以降のメッセージをリポジトリからロードする
   */
  async loadMessagesFrom(message: ChatMessage) {
    this.unsubscribeMessages()

    this.unsubscribeMessages = await Repository.onMessagesChangeFrom(
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

        // 最後からxx件キャッシュから取得しているが、並びが降順になってしまっているので、
        // 画面表示上の昇順に直す。
        cachedMessages.reverse()

        this.setMessages(cachedMessages)

        // 既読処理
        if (newMessages.length === 0) {
          return
        }
        const message = newMessages.slice(-1)[0]
        if (document.hidden) {
          readCache = {
            userId: this.$store.state.user.id,
            messageId: message.id,
          }
        } else {
          await this.updateReadUntil(message.id)
        }
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
$contents-width: 400px;

.wrapper {
  display: flex;
  justify-content: center;

  width: 100%;
}

.chat-messages {
  width: 100%;
  padding-top: var(--spacing-large);
  padding-left: var(--spacing-medium);
  padding-right: var(--spacing-medium);
  padding-bottom: 80px;
  // 自分のメッセージの傾きによって少し右にはみ出る場合がある。
  // とりあえずはみ出たら非表示（行数が多いほど傾きが大きくなって出やすい傾向）
  overflow-x: hidden;
}
@media screen and (min-width: $contents-width) {
  .chat-messages {
    width: $contents-width;
  }
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding-top: var(--spacing-small);
  padding-left: var(--spacing-medium);
  padding-right: var(--spacing-medium);
  padding-bottom: var(--spacing-small);

  display: flex;
  align-items: center;

  color: #fff;
  opacity: 0.9;

  &__contents {
    display: flex;
    align-items: center;
    &--right {
      flex: 1;
    }
  }

  &__avatars {
    position: relative;
    display: flex;
    margin-left: var(--spacing-medium);
  }
}

.footer-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;

  display: flex;
  justify-content: center;

  background-color: var(--app-color-black);
  opacity: 0.9;
}

.footer {
  width: 100%;
  height: $footer-height;
  padding-right: var(--spacing-medium);

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
      background-color: var(--app-color-black);
      color: #fff;
      border: none;
      outline: none;
    }
  }
}
@media screen and (min-width: $contents-width) {
  .footer {
    width: $contents-width;
    padding-right: 0;
  }
}
</style>
