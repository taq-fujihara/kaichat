<template>
  <div class="chat-message-wrapper" :class="{ 'is-next-me': isNextMe }">
    <div class="guide-shadow"></div>
    <div class="guide"></div>

    <div class="chat-message">
      <div class="chat-message__arrow-shadow"></div>
      <div class="chat-message__background-bottom"></div>
      <div class="chat-message__arrow"></div>
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
        <div class="created-at">{{ displayTime }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { User } from '@/models/User'
import Repository from '../repository'

@Component
export default class ChatMessageMine extends Vue {
  @Prop() private type!: 'text' | 'image'
  @Prop() private text!: string
  @Prop() private imagePath!: string
  @Prop() private imageThumbnailPath!: string
  @Prop() private usersReadThisMessage!: User[]
  @Prop() private createdAt!: Date
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
  justify-content: flex-end;

  margin-top: var(--spacing-medium);
  margin-left: var(--spacing-xlarge);

  .guide,
  .guide-shadow {
    position: absolute;
    background-color: var(--app-color-black);
  }
  .guide-shadow {
    opacity: 0.4;
  }

  &:nth-child(odd) {
    &.is-next-me {
      .guide,
      .guide-shadow {
        clip-path: polygon(23% 0, 100% 0, 65% 99%, 0 100%);
      }
    }
  }

  &.is-next-me {
    .guide,
    .guide-shadow {
      top: 20px;
      bottom: -60px;
      right: 50px;
      width: 32px;
      clip-path: polygon(0 0, 82% 0, 100% 100%, 38% 100%);
    }
    .guide-shadow {
      transform: translateX(var(--spacing-small));
    }
  }

  &:not(.is-next-me) {
    .guide,
    .guide-shadow {
      top: calc(100% - 30px);
      bottom: -60px;
      left: 0px;
      right: 20px;
      clip-path: polygon(100% 0, 100% 24px, 0 100%, 0 calc(100% - 16px));
    }

    .guide-shadow {
      transform: translateY(var(--spacing-small));
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
  margin-right: 16px;

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
    color: var(--app-color-black);
    word-break: break-all;
  }

  &__image {
    width: 100%;
  }

  &__background-bottom {
    position: absolute;
    background-color: var(--app-color-black);
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    clip-path: polygon(
      0 0,
      calc(100% - 12px) 8px,
      100% 100%,
      22px calc(100% - 8px)
    );
  }
  &__background-top {
    position: absolute;
    background-color: var(--app-color-white);
    top: 8px;
    left: 12px;
    right: 12px;
    bottom: 12px;
    clip-path: polygon(
      0 0,
      calc(100% - 4px) 4px,
      100% 100%,
      12px calc(100% - 4px)
    );
  }

  &__arrow-shadow,
  &__arrow {
    position: absolute;

    // 反転
    transform: scale(-1, 1);

    right: -16px;
    clip-path: polygon(
      0 63%,
      53% 14%,
      66% 44%,
      100% 26%,
      100% 78%,
      34% 90%,
      28% 49%
    );
  }
  &__arrow-shadow {
    top: 15px;
    width: 35px;
    height: 45px;
    background-color: var(--app-color-black);
  }
  &__arrow {
    top: 25px;
    width: 35px;
    height: 30px;
    background-color: var(--app-color-white);
  }
}

.created-at {
  text-align: right;
  margin-top: var(--spacing-small);
  font-size: var(--font-size-xsmall);
  color: var(--app-color-gray);
}
</style>
