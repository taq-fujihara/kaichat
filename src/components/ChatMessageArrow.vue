<template>
  <div
    class="chat-message__arrow"
    :class="{
      'chat-message__arrow--inverse': inverse,
      'chat-message__arrow--white': white,
      'chat-message__arrow--large': large,
    }"
  ></div>
</template>

<script lang="ts">
// 吹き出しの矢印部分コンポーネント

import Vue from 'vue'
export default Vue.extend({
  props: {
    white: {
      type: Boolean,
      default: false,
    },
    large: {
      type: Boolean,
      default: false,
    },
    inverse: {
      type: Boolean,
      default: false,
    },
  },
})
</script>

<style lang="scss" scoped>
.chat-message {
  &__arrow {
    width: 35px;
    height: 30px;

    position: absolute;
    background-color: var(--app-color-black);
    clip-path: polygon(
      0 63%,
      53% 14%,
      66% 44%,
      100% 26%,
      100% 78%,
      34% 90%,
      28% 49%
    );

    &--white {
      background-color: var(--app-color-white);
    }

    &--large {
      width: 35px;
      height: 40px;
    }

    &--inverse {
      transform: scale(-1, 1);
    }
  }
}
</style>
