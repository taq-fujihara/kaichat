<template>
  <div class="wrapper">
    <div class="contents">
      <h2>
        settings
      </h2>

      <div>
        <div class="member">
          <Avatar :photo-url="$store.state.user.photoUrl" />
          <div class="member__info">
            <div class="member__name">
              {{ $store.state.user.name }}
            </div>
            <div class="member__id">ID: {{ $store.state.user.id }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Avatar from '@/components/Avatar.vue'

@Component({ components: { Avatar } })
export default class Settings extends Vue {}
</script>
j
<style lang="scss" scoped>
$contents-width: 390px;

.wrapper {
  display: flex;
  justify-content: center;
}

.contents {
  width: 100%;
  max-width: $contents-width;

  color: #fff;
}

.member {
  display: flex;
  margin-top: var(--spacing-medium);

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  &__id {
    flex: 1;
    font-size: var(--font-size-small);
    display: flex;
    align-items: center;
  }
  &__name {
    flex: 1;
    display: flex;
    align-items: center;
  }

  &__actions {
    display: flex;
    align-items: center;
  }
}
</style>
