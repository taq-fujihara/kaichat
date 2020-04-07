<template>
  <div class="chat-message-wrapper" :class="{ 'is-next-me': isNextMe }">
    <div class="guide-shadow"></div>
    <div class="guide"></div>

    <Avatar
      :photo-url="photoUrl"
      loading="lazy"
      :background-color="avatarBackgroundColor"
    />

    <div class="chat-message">
      <ChatMessageArrow large white class="chat-message__arrow--back" />
      <div class="chat-message__background-bottom"></div>
      <ChatMessageArrow class="chat-message__arrow--front" />
      <div class="chat-message__background-top"></div>

      <div class="chat-message__text">
        <span v-if="type === 'text'">
          {{ text }}
        </span>
        <div v-if="type === 'image'">
          <span v-if="!imageUrl">
            Loading...
          </span>
          <img v-else class="chat-message__image" :src="imageUrl" />
        </div>
        <ChatMessageCreatedAt :created-at="createdAt" />
      </div>
    </div>

    <div class="users-read-this-message">
      <div
        v-for="user in usersReadThisMessage"
        :key="user.id"
        class="users-read-this-message__user"
      >
        <img class="users-read-this-message__image" :src="user.photoUrl" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import ChatMessageArrow from '@/components/ChatMessageArrow.vue'
import ChatMessageCreatedAt from '@/components/ChatMessageCreatedAt.vue'
import Avatar from '@/components/Avatar.vue'
import { User } from '@/models/User'
import Repository from '@/repository'

@Component({
  components: { Avatar, ChatMessageArrow, ChatMessageCreatedAt },
})
export default class ChatMessage extends Vue {
  @Prop() private type!: 'text' | 'image'
  @Prop() private text!: string
  @Prop() private imagePath!: string
  @Prop() private imageThumbnailPath!: string
  @Prop() private createdAt!: Date
  @Prop() private photoUrl!: string
  @Prop() private avatarBackgroundColor!: string
  @Prop() private usersReadThisMessage!: User[]
  @Prop() private even!: boolean
  @Prop() private isNextMe!: boolean

  private imageUrl: string | null = null

  @Watch('imageThumbnailPath', { immediate: true })
  async onThumbnail(path: string) {
    if (path) {
      this.imageUrl = await Repository.getImageUrl(path)
    }
  }

  private get displayTime() {
    // 1年前とかちょっと凝りたいけど、どうせ今は表示件数制限とかあるからいいや、、、
    const month = this.createdAt.getMonth()
    const date = this.createdAt.getDate()
    const hour = this.createdAt.getHours()
    const minute = this.createdAt.getMinutes()
    return `${month}/${date} ${hour}:${minute}`
  }
}
</script>

<style scoped lang="scss">
.chat-message-wrapper {
  position: relative;

  display: flex;
  align-items: flex-start;

  margin-top: var(--spacing-medium);
  margin-left: var(--spacing-small);
  margin-right: var(--spacing-xlarge);

  &:nth-child(odd) {
    margin-left: var(--spacing-mediumlarge);

    &:not(.is-next-me) {
      .guide,
      .guide-shadow {
        clip-path: polygon(23% 0, 100% 0, 65% 99%, 0 100%);
      }
    }
  }

  .guide,
  .guide-shadow {
    position: absolute;
    background-color: var(--app-color-black);
  }
  .guide-shadow {
    opacity: 0.4;
  }

  &.is-next-me {
    .guide,
    .guide-shadow {
      top: 20px;
      bottom: -60px;
      left: 20px;
      right: 0px;
      width: 100%;
      clip-path: polygon(0 0, 100% calc(100% - 24px), 100% 100%, 0 32px);
    }
    .guide-shadow {
      transform: translateY(var(--spacing-small));
    }
  }

  &:not(.is-next-me) {
    .guide,
    .guide-shadow {
      top: 20px;
      bottom: -60px;
      left: 20px;
      right: auto;
      width: 30px;
      clip-path: polygon(79% 0, 100% 100%, 40% 100%, 0 0);
    }

    .guide-shadow {
      transform: translateX(var(--spacing-small));
    }
  }

  &:last-child {
    .guide,
    .guide-shadow {
      display: none;
    }
  }
}

.chat-message {
  position: relative;
  margin-left: -10px; // アバター画像に少し重ねる

  $chat-message-padding-top: 20px;
  $chat-message-padding-left: 32px;
  $chat-message-padding-right: 32px;
  $chat-message-padding-bottom: 24px;

  &__text {
    position: relative;
    min-width: 80px;

    padding-top: $chat-message-padding-top;
    padding-left: $chat-message-padding-left;
    padding-right: $chat-message-padding-right;
    padding-bottom: $chat-message-padding-bottom;

    font-weight: bold;
    font-size: var(--font-size-small);
    color: var(--app-color-white);
    word-break: break-all;
  }

  &__image {
    width: 100%;
  }

  &__background-bottom {
    position: absolute;
    background-color: var(--app-color-white);
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    clip-path: polygon(
      12px 8px,
      100% 0,
      calc(100% - 22px) calc(100% - 8px),
      0 100%
    );
  }
  &__background-top {
    position: absolute;
    background-color: var(--app-color-black);
    top: 8px;
    left: 12px;
    right: 12px;
    bottom: 12px;
    clip-path: polygon(
      4px 4px,
      100% 0,
      calc(100% - 12px) calc(100% - 4px),
      0 100%
    );
  }

  &__arrow {
    position: absolute;
    left: -16px;

    &--front {
      top: 25px;
    }
    &--back {
      top: 15px;
    }
  }
}

.users-read-this-message {
  position: absolute;
  bottom: -10px;

  &__user {
    overflow: hidden;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 4px solid var(--app-color-black);
  }

  &__image {
    width: 30px;
  }
}
</style>
