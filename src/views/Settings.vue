<template>
  <div class="wrapper">
    <div class="contents">
      <app-header title="Settings" :onBack="() => back()" />
      <div class="app-body">
        <UserProfile :user="user" />
        <div class="buttons actions">
          <app-button @click="clearCache">
            <i class="fas fa-trash" />
            Clear Cache
          </app-button>
          <app-button @click="signOut">
            <i class="fas fa-sign-out-alt" />
            Sign Out</app-button
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Avatar from '@/components/Avatar.vue'
import UserProfile from '@/components/UserProfile.vue'
import { signOut } from '@/firebaseApp'
import { clearAll } from '@/repository/MessagesCache'
import { User } from '../models/User'

@Component({ components: { Avatar, UserProfile } })
export default class Settings extends Vue {
  private get user(): User {
    return this.$store.state.user
  }

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
}
</style>
