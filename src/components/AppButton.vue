<template>
  <button class="app-button" v-on="listeners">
    <slot />
  </button>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  computed: {
    listeners() {
      return {
        ...this.$listeners,
      }
    },
  },
})
</script>

<style lang="scss" scoped>
.app-button {
  background-color: var(--app-color-black);
  color: var(--app-color-white);
  border-radius: 5px;
  border: none;
  padding-top: 8px;
  padding-bottom: 8px;
  padding-left: 16px;
  padding-right: 16px;

  &:hover {
    cursor: pointer;
  }
}
</style>
