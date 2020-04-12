<template>
  <div>
    <app-header @back="$router.push('/rooms')" transparent>
      <Avatar
        v-for="user in members"
        :key="user.id"
        :photo-url="user.photoUrl"
        :is-small="true"
      />
      <template v-slot:left>
        <i
          class="fas fa-cog clickable fa-lg"
          @click="$router.push(`/rooms/${roomId}`)"
        />
      </template>
    </app-header>

    <div class="chat-messages">
      <component
        v-for="message in messages"
        :is="getMessageComponent(message.userId)"
        :is-next-me="message.meta.isNextMyMessage"
        :key="message.id"
        :type="message.type"
        :text="message.text"
        :likes="message.likes"
        :image-path="message.imagePath"
        :image-thumbnail-path="message.imageThumbnailPath"
        :thumbnail-base64="message.thumbnailBase64"
        :users-read-this-message="message.meta.usersReadThisMessage"
        :created-at="message.createdAt"
        :photoUrl="findPhotoUrl(message.userId)"
        @heart="heartMessage(message)"
        @click-image="handleImageClick(message)"
      />
    </div>

    <div class="footer">
      <div class="footer__content">
        <div class="footer__content__left">
          <div>
            <app-input
              placeholder="Jot something down"
              :value.sync="message"
              @keydown.enter="keyEnter"
            />
          </div>
          <div class="footer__extra-actions">
            <i
              class="footer__extra-actions__icon fas fa-image clickable"
              @click="$refs.fileselect.click()"
            />
            <i
              class="footer__extra-actions__icon fas fa-camera clickable"
              @click="$refs.camera.click()"
            />
          </div>
        </div>
        <div class="footer__content__right">
          <app-button
            :disabled="message.length === 0"
            @click="publishMessage(message, null)"
            secondary
          >
            <i class="fas fa-paper-plane fa-lg" />
          </app-button>
        </div>
      </div>
    </div>

    <!-- 画像ビューアー（TODO コンポーネント化） -->
    <div v-if="imageViewerActive" class="image-viewer">
      <img
        v-if="imageViewing"
        :src="imageViewing"
        class="image-viewer__image"
      />
      <i v-else class="image-viewer__spinner fas fa-spinner fa-2x" />
      <div
        class="image-viewer__close clickable"
        @click="imageViewerActive = false"
      >
        <i class="fas fa-times fa-2x" />
      </div>
    </div>

    <!-- 画像選択用input -->
    <input
      hidden
      ref="fileselect"
      @change="uploadImage($event.target.files)"
      type="file"
      accept="image/*"
    />
    <!-- 画像選択用input -->
    <input
      hidden
      ref="camera"
      @change="uploadImage($event.target.files)"
      type="file"
      accept="image/*"
      capture
    />

    <!-- TODO コンポーネント化 -->
    <div class="snackbar" v-if="uploadingImage">
      画像をアップロードしています...
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import Avatar from '@/components/Avatar.vue'
import ChatMessageComponent from '@/components/ChatMessage.vue'
import ChatMessageMine from '@/components/ChatMessageMine.vue'
import Repository from '@/repository'
import { User } from '@/models/User'
import ChatMessage from '@/models/ChatMessage'
import { shrinkImage } from '@/utils/image'

const photoUrlCache = new Map<string, string | null>()
let readCache: { userId: string; messageId: string } | undefined

function scrollToBottom() {
  const elem = document.documentElement
  const bottom = elem.scrollHeight - elem.clientHeight
  window.scroll(0, bottom)
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

  // 部屋メンバー
  private members = new Array<User>()

  private read = new Array<{ user: User; messageId: string }>()

  // 表示メッセージ
  private messages = new Array<ChatMessage>()

  // 画像表示
  private uploadingImage = false
  private imageViewerActive = false
  private imageViewing = ''

  // メッセージ監視をやめる
  private unsubscribeMessages = () => {
    // do nothing
  }

  // 部屋情報監視をやめる
  private unsubscribeSomeoneRead = () => {
    // do nothing
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
      await this.loadMessages()
      scrollToBottom()
    } catch (error) {
      alert('メッセージがロードできませんでした！部屋一覧に戻ります。')
      this.$router.push('/rooms')
      return
    }

    try {
      await this.loadMembers()
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
    readCache = undefined

    this.unsubscribeMessages()
    this.unsubscribeSomeoneRead()

    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange,
    )
  }

  // ******************************************************
  // Instance methods
  // ******************************************************

  initCache() {
    Repository.initCache(this.roomId)
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

  /**
   * メッセージをリポジトリからロードする
   */
  async loadMessages() {
    this.unsubscribeMessages()

    this.unsubscribeMessages = await Repository.onMessagesChange(
      this.roomId,
      async messages => {
        const oldLastMessageId =
          this.messages.length > 0 ? this.messages.slice(-1)[0].id : undefined

        this.setMessages(messages)

        const newLastMessageId =
          this.messages.length > 0 ? this.messages.slice(-1)[0].id : undefined
        const containsNewMessage = oldLastMessageId !== newLastMessageId

        if (messages.length === 0) {
          return
        }

        // 既読処理
        const message = messages.slice(-1)[0]
        if (document.hidden) {
          readCache = {
            userId: this.$store.state.user.id,
            messageId: message.id,
          }
        } else {
          await this.updateReadUntil(message.id)
        }

        if (containsNewMessage) {
          scrollToBottom()
        }
      },
    )
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

  async loadMembers() {
    await Repository.getRoomMembers(this.roomId, users => {
      const usersButMe = users.filter(u => u.id !== this.$store.state.user.id)
      usersButMe.sort()
      this.members = usersButMe
    })
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

  async publishMessage(text: string) {
    const message = text ? text.trim() : ''
    if (!message) {
      return
    }

    this.message = ''

    try {
      await Repository.addMessage(
        this.roomId,
        this.$store.state.user.id,
        message,
      )
    } catch (error) {
      throw new Error(error)
    }
  }

  keyEnter() {
    this.publishMessage(this.message)
  }

  private async uploadImage(files: FileList) {
    if (files.length === 0) {
      return
    }

    this.uploadingImage = true

    const file = files[0]
    const shrinked = await shrinkImage(file)
    await Repository.uploadImage(this.roomId, file.name, shrinked)

    this.uploadingImage = false
  }

  private async heartMessage(message: ChatMessage) {
    await Repository.likeMessage(this.roomId, message.id)
  }

  private async handleImageClick(message: ChatMessage) {
    this.imageViewing = ''
    await this.$nextTick() // 前表示していた画像表示が消えることを保証したい（これでいいのか？）

    this.imageViewerActive = true
    this.imageViewing = await Repository.getImageUrl(this.roomId, message.id)
  }
}
</script>

<style lang="scss" scoped>
.chat-messages {
  width: 100%;
  padding-top: var(--app-header-height);
  padding-bottom: calc(var(--app-footer-height) + var(--spacing-medium));
  // 自分のメッセージの傾きによって少し右にはみ出る場合がある。
  // とりあえずはみ出たら非表示（行数が多いほど傾きが大きくなって出やすい傾向）
  overflow-x: hidden;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--app-footer-height);

  background-color: var(--app-color-black);

  display: flex;
  align-items: center;
  justify-content: center;

  &__content {
    width: 100%;
    max-width: var(--app-content-width);
    display: flex;
    align-items: center;
    padding-left: var(--spacing-medium);
    padding-right: var(--spacing-medium);

    .text {
      flex: 1;
      margin-right: 8px;
      display: flex;
      align-items: center;

      textarea {
        resize: none;
        width: 100%;

        line-height: 25px;
        background-color: transparent;

        border: none;
        outline: none;
      }
    }

    &__left {
      flex: 1;
    }
    &__right {
      margin-left: var(--spacing-medium);
    }
  }

  &__extra-actions {
    &__icon {
      &:not(:first-of-type) {
        margin-left: var(--spacing-medium);
      }
    }
  }
}

.image-viewer {
  position: fixed;
  z-index: 1000;

  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  background-color: var(--app-color-black);
  background-size: cover;

  &__image {
    max-width: 100%;
    max-height: 100%;
  }

  &__spinner {
    animation: spin 1s infinite linear;
  }

  &__close {
    position: absolute;
    top: var(--spacing-medium);
    right: var(--spacing-medium);
  }
}

.snackbar {
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;

  left: 0;
  right: 0;
  bottom: 0;
  height: var(--app-footer-height);

  z-index: 500;

  background-color: var(--app-color-black);
  color: var(--app-color-white);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
