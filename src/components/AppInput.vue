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
