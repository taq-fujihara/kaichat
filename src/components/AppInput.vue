<template>
  <input
    type="text"
    class="app-input"
    :value="value"
    :placeholder="placeholder"
    @input="$emit('update:value', $event.target.value)"
    v-on="listeners"
  />
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  props: {
    value: {
      type: String,
    },
    placeholder: {
      type: String,
    },
  },
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
.app-input {
  width: 100%;
  line-height: 1.5;

  padding-top: 8px;
  padding-bottom: 8px;

  background-color: transparent;
  color: var(--app-color-white);
  caret-color: var(--app-color-white);
  border: none;
  border-bottom: 2px solid var(--app-color-black);

  &::placeholder {
    color: var(--app-color-gray);
  }

  &:focus {
    outline: 0;
  }
}
</style>
