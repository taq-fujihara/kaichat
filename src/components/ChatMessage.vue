<template>
  <div class="chat-message-wrapper">
    <div v-if="!isLast" class="guide-shadow" :class="{ even, isNextMe }"></div>
    <div v-if="!isLast" class="guide" :class="{ even, isNextMe }"></div>

    <div class="user-pic">
      <div class="user-pic__background"></div>
      <div class="user-pic__image">
        <img :src="userPic" />
      </div>
    </div>

    <div class="chat-message">
      <div class="chat-message__background"></div>

      <div class="chat-message__arrow-shadow"></div>
      <div class="chat-message__arrow"></div>

      <span class="chat-message__chat-text">
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
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class ChatMessage extends Vue {
  @Prop() private text!: string;
  @Prop() private userPic!: string;
  @Prop() private even!: boolean;
  @Prop() private isNextMe!: boolean;
  @Prop() private isLast!: boolean;

  private get displayText(): Array<string> {
    return this.text.split("\n");
  }
}
</script>

<style scoped lang="scss">
.chat-message-wrapper {
  position: relative;

  display: flex;
  align-items: flex-start;

  margin-top: 32px;
  margin-right: 64px;

  &.even {
    margin-left: 24px;
  }
}

.user-pic {
  position: relative;

  width: 50px;
  height: 50px;

  padding: 8px;
  margin-right: 16px;

  transform: skewX(10deg) rotate(2deg);

  background-color: #000304;
  color: #fff;

  &__background {
    position: absolute;
    top: 5px;
    bottom: 4px;
    left: 4px;
    right: 5px;
    background-color: #fff;
    transform: skewX(5deg) rotate(3deg);
  }

  &__image {
    position: relative;
    overflow: hidden;

    height: 50px;
    width: 50px;

    img {
      position: absolute;
      left: -5px;
      top: -5px;
      height: 60px;
      transform: skewX(-10deg) rotate(-2deg);
    }
  }
}

.chat-message {
  display: inline-block;
  position: relative;

  min-width: 60px;

  transform: skewX(-15deg) rotate(-2deg);

  margin-top: 4px;
  padding-top: 16px;
  padding-bottom: 16px;
  padding-left: 24px;
  padding-right: 24px;

  background-color: #fff;
  color: #fff;

  &__background {
    position: absolute;
    top: 4px;
    bottom: 8px;
    left: 6px;
    right: 8px;
    background-color: #000304;
    transform: skewX(5deg) rotate(1deg);
  }

  &__arrow,
  &__arrow-shadow {
    position: absolute;
    background-color: #000304;

    top: 10px;
    left: -25px;
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
    background-color: #fff;
    top: 5px;
    left: -30px;
    height: 40px;
  }

  &__chat-text {
    font-weight: bold;
    font-size: small;
    word-break: break-all;

    display: inline-block;
    transform: skewX(15deg) rotate(1deg);
  }

  &__chat-text-line {
    display: block;
  }
}

.guide,
.guide-shadow {
  position: absolute;
  background-color: #000304;

  // 基本（相手の投稿から相手の投稿へ）
  top: 20px;
  bottom: -60px;
  left: 20px;
  right: auto;
  width: 30px;
  clip-path: polygon(79% 0, 100% 100%, 40% 100%, 0 0);

  &:not(.isNextMe).even {
    // ジグザグに
    clip-path: polygon(23% 0, 100% 0, 65% 99%, 0 100%);
  }

  // そのまま相手の投稿に
  &.isNextMe {
    right: 0px;
    width: 100%;
    clip-path: polygon(0 0, 100% 76%, 100% 100%, 0 24%);
  }
}

.guide-shadow {
  opacity: 0.4;

  // 基本
  bottom: -60px;
  left: 25px;

  // そのまま相手の投稿に
  &.isNextMe {
    top: 30px;
    bottom: -70px;
  }
}
</style>
