<template>
  <div class="app-header" :class="variantClasses">
    <div class="app-header__content">
      <div class="app-header__content__right">
        <i
          v-if="$listeners.back"
          class="app-header__back fas fa-arrow-left fa-lg clickable"
          @click="$emit('back')"
        />
        <div class="app-header__title">
          {{ title }}
        </div>
        <slot />
      </div>
      <div class="app-header__content__left">
        <slot name="left" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  props: {
    title: {
      type: String,
    },
    transparent: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    variantClasses() {
      return {
        'app-header--transparent': this.transparent,
      }
    },
  },
})
</script>

<style lang="scss" scoped>
.app-header {
  position: fixed;
  top: 0;
  height: var(--app-header-height);
  left: 0;
  right: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  background-color: var(--app-bg-color);

  z-index: 100;

  &__title {
    font-size: var(--font-size-xlarge);
    font-weight: bold;
  }

  &__content {
    width: 100%;
    max-width: var(--app-content-width);
    display: flex;
    align-items: center;
    padding-left: var(--spacing-medium);
    padding-right: var(--spacing-medium);

    &__right {
      flex: 1;
      display: flex;
      align-items: center;
    }
  }

  &__back {
    margin-right: var(--spacing-medium);
  }

  &--transparent {
    background-color: transparent;
  }
}
</style>
