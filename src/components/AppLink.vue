<template>
  <a class="app-link" :href="href" v-on="$listeners">
    <slot />
  </a>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  props: {
    href: {
      type: String,
      default: '#',
    },
  },
})
</script>

<style lang="scss" scoped>
.app-link {
  &:link,
  &:visited {
    color: inherit;
  }
}
</style>
