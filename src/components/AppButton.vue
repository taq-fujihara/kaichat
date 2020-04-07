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
}
</style>
