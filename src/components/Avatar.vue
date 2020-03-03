<template>
  <div class="avatar" :class="{ 'avatar--small': isSmall }">
    <div class="avatar__background"></div>
    <div class="avatar__image" :style="{ backgroundColor }">
      <img :src="photoUrl" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class Avatar extends Vue {
  @Prop() private photoUrl!: string
  @Prop() private userName!: string
  @Prop() private backgroundColor!: string
  @Prop({ default: false }) private isSmall!: boolean
}
</script>

<style scoped lang="scss">
$size: 50px;
$size-small: 35px;

.avatar {
  position: relative;

  &--small {
    width: $size-small;
    height: $size-small;

    .avatar__image {
      height: $size-small;
      width: $size-small;

      img {
        height: $size-small + 10;
      }
    }
  }

  padding: 8px;
  margin-right: 16px;

  transform: skewX(10deg) rotate(2deg);

  background-color: var(--color-app-black);
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

    width: $size;
    height: $size;

    img {
      position: absolute;
      left: -5px;
      top: -5px;
      height: $size + 10;
      transform: skewX(-10deg) rotate(-2deg);
    }
  }
}
</style>
