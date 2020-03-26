<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class App extends Vue {}
</script>

<style lang="scss">
html,
body {
  margin: 0;
  padding: 0;
  background-color: var(--app-bg-color);
  color: var(--app-fg-color);
}

#app {
  font-family: 'M PLUS 1p';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
