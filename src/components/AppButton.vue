<template>
  <button
    class="app-button"
    :class="variableClasses"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <slot />
  </button>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    secondary: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    variableClasses() {
      return {
        'app-button--secondary': this.secondary,
        'is-loading': this.loading,
      }
    },
  },
})
</script>

<style lang="scss" scoped>
$border-size: 3px;

.app-button {
  box-sizing: border-box;
  position: relative;
  background-color: var(--app-color-black);
  color: var(--app-color-white);
  line-height: 1.5;

  border-radius: 3px;

  border: none; // cancel browser specific border
  border-bottom: solid $border-size var(--app-color-gray);

  padding-top: 8px;
  padding-bottom: 8px;
  padding-left: 16px;
  padding-right: 16px;

  transition: transform 50ms ease-out;

  i {
    &:not(:only-child) {
      margin-right: var(--spacing-small);
    }
  }

  &:focus {
    outline: 0;
  }
  &:active {
    transform: translateY($border-size);
  }
  &:hover {
    cursor: pointer;
  }
  &:disabled {
    background-color: var(--app-color-gray);
    opacity: 0.7;
    cursor: default;
  }

  &--secondary {
    background-color: var(--app-color-red);
  }

  &.is-loading {
    color: transparent;

    &::after {
      content: '';
      position: absolute;
      top: calc(50% - 1em / 2);
      left: calc(50% - 1em / 2);
      width: 1em;
      height: 1em;
      border-top: 2px solid var(--app-color-white);
      border-left: 2px solid var(--app-color-white);
      border-radius: 50%;
      animation: spin 1s infinite linear;
    }
  }
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
