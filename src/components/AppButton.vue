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
    secondary: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    variableClasses() {
      return {
        'app-button--secondary': this.secondary,
      }
    },
  },
})
</script>

<style lang="scss" scoped>
.app-button {
  box-sizing: border-box;
  line-height: 1.5;
  position: relative;
  background-color: var(--app-color-black);
  color: var(--app-color-white);
  border-radius: 4px;
  border: none;
  padding-top: 8px;
  padding-bottom: 8px;
  padding-left: 16px;
  padding-right: 16px;
  border-bottom: solid 2px var(--app-color-gray);
  transition: background-color 0.2s ease-in-out, opacity 0.2s ease-in-out;

  &:focus {
    outline: 0;
  }
  &:active {
    border-bottom: solid 2px transparent;
  }
  &:hover {
    cursor: pointer;
  }
  &:disabled {
    background-color: var(--app-color-gray);
    opacity: 0.5;
    cursor: default;
  }

  &--secondary {
    background-color: var(--app-color-red);
  }
}
</style>
