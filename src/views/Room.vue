<template>
  <div>
    <app-header
      title="Room"
      @back="$router.push(`/rooms/${roomId}/messages`)"
    />

    <div class="app-body">
      <div class="title">部屋ID</div>
      <div class="field">{{ roomId }}</div>

      <app-input :value.sync="name" placeholder="部屋の名前" />

      <p class="sub-text">
        メンバー
      </p>
      <div>
        <UserProfile
          v-for="member in members"
          :key="member.id"
          :user="member"
        />
      </div>

      <div class="add-member">
        <div class="input-with-buttons">
          <div class="input-with-buttons__input">
            <app-input placeholder="追加するユーザー" :value.sync="newUserId" />
          </div>
          <div class="input-with-buttons__buttons">
            <app-button @click="addMember">
              Add
            </app-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Repository from '@/repository'
import UserProfile from '@/components/UserProfile.vue'

export default {
  name: 'Room',
  components: { UserProfile },
  props: {
    roomId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      name: '',
      owner: '',
      members: [],
      newUserId: '',
    }
  },
  methods: {
    async addMember() {
      const userId = this.newUserId.trim()
      if (!userId) {
        return
      }

      if (this.members.find(m => m.id === userId)) {
        alert('そのユーザーは既に登録されています。')
        return
      }

      // TODO ユーザーの存在チェック
      await Repository.addMember(this.roomId, userId)
    },
  },
  async mounted() {
    try {
      const room = await Repository.getRoom(this.roomId)
      this.name = room.name
      this.owner = room.owner
    } catch (error) {
      alert('部屋が取得できませんでした！部屋一覧に戻ります。')
      this.$router.push('/rooms')
      return
    }

    try {
      this.members = await Repository.getRoomMembers(this.roomId)
    } catch (error) {
      alert('メンバーが取得できませんでした！部屋一覧に戻ります。')
      this.$router.push('/rooms')
    }
  },
}
</script>

<style lang="scss" scoped>
.header {
  padding: var(--spacing-small);
  color: #fff;
}

.wrapper {
  display: flex;
  justify-content: center;

  color: #fff;
}

.contents {
  width: 100%;
  max-width: 390px;
}

.title {
  font-size: small;
  margin-top: var(--spacing-large);
  margin-bottom: var(--spacing-small);
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

.add-member {
  margin-top: var(--spacing-medium);
}
</style>
