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
      <div class="actions">
        <a class="actions__link" href="#" @click.prevent="back">Back</a>
        <a class="actions__link" href="#" @click.prevent="clearCache"
          >Clear Cache</a
        >
        <a class="actions__link" href="#" @click.prevent="signOut">Sign Out</a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Avatar from '@/components/Avatar.vue'
import { signOut } from '@/firebaseApp'
import { clearAll } from '@/repository/MessagesCache'

@Component({ components: { Avatar } })
export default class Settings extends Vue {
  back() {
    this.$router.push('/rooms')
  }
  async clearCache() {
    await clearAll()
    alert('キャッシュをクリアしました。')
  }
  async signOut() {
    await signOut()
  }
}
</script>

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

.actions {
  margin-top: var(--spacing-large);
  color: #fff;

  &__link {
    &:not(:first-child) {
      margin-left: var(--spacing-medium);
    }
  }
}
</style>
