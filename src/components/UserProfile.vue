<template>
  <div class="user-profile">
    <Avatar :photo-url="user.photoUrl" />
    <div class="user-profile__info">
      <div class="user-profile__name">
        {{ user.name }}
      </div>
      <div class="user-profile__id">ID: {{ user.id }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import Avatar from '@/components/Avatar.vue'
import { User } from '../models/User'

@Component({
  components: { Avatar },
})
export default class UserProfile extends Vue {
  @Prop({ required: true }) user!: User
}
</script>

<style lang="scss" scoped>
.user-profile {
  display: flex;
  padding-top: var(--spacing-medium);
  padding-bottom: var(--spacing-medium);

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
