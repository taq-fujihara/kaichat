<template>
  <div class="avatar">
    <div class="avatar__background"></div>
    <div class="avatar__image">
      <img :src="photoUrl" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class Avatar extends Vue {
  @Prop() private msg!: string;
  @Prop() private photoUrl!: string;
  @Prop() private userName!: string;
}
</script>

<style scoped lang="scss">
.avatar {
  position: relative;

  width: 50px;
  height: 50px;

  padding: 8px;
  margin-right: 16px;

  transform: skewX(10deg) rotate(2deg);

  background-color: #000304;
  color: #fff;

  &__background {
    position: absolute;
    top: 5px;
    bottom: 4px;
    left: 4px;
    right: 5px;
    background-color: #fff;
    transform: skewX(5deg) rotate(3deg);
  }

  &__image {
    position: relative;
    overflow: hidden;

    height: 50px;
    width: 50px;

    img {
      position: absolute;
      left: -5px;
      top: -5px;
      height: 60px;
      transform: skewX(-10deg) rotate(-2deg);
    }
  }
}
</style>
