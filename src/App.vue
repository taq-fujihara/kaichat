<template>
  <div id="app">
    <div id="contents">
      <router-view />
    </div>
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

  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
}

#contents {
  position: relative;
  width: 100%;
  max-width: var(--app-content-width);
  padding-left: var(--spacing-medium);
  padding-right: var(--spacing-medium);
}
</style>
