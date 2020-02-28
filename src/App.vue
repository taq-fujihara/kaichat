<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class App extends Vue {}
</script>

<style lang="scss">
@import url("https://fonts.googleapis.com/css?family=Nunito:400,700");

// Set your brand colors
// $purple: #8a4d76;
// $pink: #fa7c91;
// $brown: #757763;
// $beige-light: #d0d1cd;
// $beige-lighter: #eff0eb;

// // Update Bulma's global variables
// $family-sans-serif: "Nunito", sans-serif;
// $grey-dark: $brown;
// $grey-light: $beige-light;
// $primary: $purple;
$primary: #cc0001;
// $link: $pink;

// // Update some of Bulma's component variables
// $control-border-width: 2px;
// $input-background-color: $beige-lighter;
// $input-border-color: transparent;
// $input-shadow: none;

// @import "bulma/bulma.sass";
@import "bulma/sass/utilities/_all.sass";
@import "bulma/sass/elements/button.sass";
@import "bulma/sass/elements/icon.sass";

html,
body {
  margin: 0;
  padding: 0;
  background-color: $primary;
}

#app {
  // font-family: Avenir, Helvetica, Arial, sans-serif;
  font-family: "M PLUS 1p";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  // text-align: center;
  // color: #2c3e50;
}

// TODO styles.scssとかに移す
.clickable {
  cursor: pointer;
}
</style>
