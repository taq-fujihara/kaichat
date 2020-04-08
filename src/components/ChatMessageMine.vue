<template>
  <div class="chat-message-wrapper" :class="{ 'is-next-me': isNextMe }">
    <div class="guide-shadow"></div>
    <div class="guide"></div>

    <div class="chat-message">
      <ChatMessageArrow inverse large class="chat-message__arrow--back" />
      <div class="chat-message__background-bottom"></div>
      <ChatMessageArrow white inverse class="chat-message__arrow--front" />
      <div class="chat-message__background-top"></div>
      <div class="chat-message__text">
        <span v-if="type === 'text'">
          {{ text }}
        </span>
        <div v-if="type === 'image'">
          <span v-if="!imageUrl">
            Loading...
          </span>
          <img
            v-else
            class="chat-message__image clickable"
            :src="imageUrl"
            @click="$emit('click-image', imagePath)"
          />
        </div>
        <ChatMessageCreatedAt :created-at="createdAt" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import ChatMessageArrow from '@/components/ChatMessageArrow.vue'
import ChatMessageCreatedAt from '@/components/ChatMessageCreatedAt.vue'
import { User } from '@/models/User'
import Repository from '../repository'

@Component({ components: { ChatMessageArrow, ChatMessageCreatedAt } })
export default class ChatMessageMine extends Vue {
  @Prop() private type!: 'text' | 'image'
  @Prop() private text!: string
  @Prop() private imagePath!: string
  @Prop() private imageThumbnailPath!: string
  @Prop() private thumbnailBase64!: string
  @Prop() private usersReadThisMessage!: User[]
  @Prop() private createdAt!: Date
  @Prop() private isNextMe!: boolean

  private imageUrl: string | null = null

  async created() {
    if (this.thumbnailBase64) {
      this.imageUrl = this.thumbnailBase64
    } else if (this.imageThumbnailPath) {
      this.imageUrl = await Repository.getImageUrl(this.imageThumbnailPath)
    }
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

  &__arrow {
    position: absolute;
    right: -16px;

    &--front {
      top: 25px;
    }
    &--back {
      top: 15px;
    }
  }
}
</style>
