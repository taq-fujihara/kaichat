<template>
  <div>
    <app-header title="Settings" @back="back" />
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
.actions {
  margin-top: var(--spacing-large);
}
</style>
