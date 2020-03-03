<template>
  <div class="chat-message-wrapper chat-message-wrapper">
    <div class="guide-shadow" :class="{ even, isNextMe }"></div>
    <div class="guide" :class="{ even, isNextMe }"></div>

    <div class="chat-message chat-message">
      <div class="chat-message__background chat-message__background"></div>

      <div class="chat-message__arrow-shadow"></div>
      <div class="chat-message__arrow"></div>

      <span class="chat-message__chat-text chat-message__chat-text">
        <slot />
        <span
          class="chat-message__chat-text-line"
          v-for="(t, i) in displayText"
          :key="i"
        >
          {{ t }}
        </span>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class ChatMessageMine extends Vue {
  @Prop() private text!: string
  @Prop() private even!: boolean
  @Prop() private isNextMe!: boolean

  private get displayText(): Array<string> {
    if (!this.text) {
      return []
    }
    return this.text.split('\n')
  }
}
</script>

<style scoped lang="scss">
.chat-message-wrapper {
  position: relative;

  display: flex;
  align-items: flex-start;

  margin-top: var(--spacing-medium);
  margin-left: 64px;

  justify-content: flex-end;

  &:last-child {
    .guide,
    .guide-shadow {
      display: none;
    }
  }
}

.chat-message {
  display: inline-block;
  position: relative;

  min-width: 60px;

  transform: skewX(15deg);

  margin-top: 4px;
  margin-right: 24px;
  padding-top: 16px;
  padding-bottom: 16px;
  padding-left: 24px;
  padding-right: 24px;

  background-color: var(--color-app-black);
  color: var(--color-app-black);

  &__background {
    position: absolute;
    top: 4px;
    bottom: 8px;
    left: 6px;
    right: 8px;
    background-color: #fff;
    transform: skewX(-5deg);
  }

  &__arrow,
  &__arrow-shadow {
    position: absolute;
    background-color: #fff;
    transform: scale(-1, 1);

    top: 10px;
    right: -25px;
    height: 30px;
    width: 35px;
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
    background-color: var(--color-app-black);
    top: 5px;
    right: -30px;
    height: 40px;
  }

  &__chat-text {
    font-weight: bold;
    font-size: small;
    word-break: break-all;

    display: inline-block;
    transform: skewX(-15deg);
  }

  &__chat-text-line {
    display: block;
  }
}

.guide,
.guide-shadow {
  position: absolute;
  background-color: var(--color-app-black);

  // 基本（自分の投稿から相手の投稿へ）
  top: 20px;
  bottom: -60px;
  left: -20px;
  right: 30px;
  clip-path: polygon(100% 0, 100% 24px, 0 100%, 0 calc(100% - 16px));

  // そのまま自分の投稿に
  &.isNextMe {
    left: auto;
    right: 50px;
    width: 32px;
    clip-path: polygon(0 0, 82% 0, 100% 100%, 38% 100%);

    // ジグザグに
    &.even {
      clip-path: polygon(23% 0, 100% 0, 65% 99%, 0 100%);
    }
  }
}

.guide-shadow {
  opacity: 0.4;

  // 基本
  transform: translateY(var(--spacing-small));

  // そのまま自分の投稿に
  &.isNextMe {
    transform: translateX(var(--spacing-small));
  }
}
</style>
