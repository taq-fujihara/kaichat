<template>
  <div>
    <div class="header">
      <i
        class="fas fa-arrow-left fa-lg clickable"
        @click="$router.push('/rooms')"
      ></i>
    </div>

    <div class="wrapper">
      <div class="contents">
        <div class="title">ID</div>
        <div class="field">{{ roomId }}</div>

        <div class="title">名前</div>
        <div class="field">
          <div class="control">
            <input type="text" v-model="name" />
          </div>
        </div>

        <div class="title">メンバー</div>
        <div class="field">
          <div v-for="member in members" class="member" :key="member.id">
            <Avatar :photo-url="member.photoUrl" />
            <div class="member__info">
              <div class="member__name">
                {{ member.name }}
                <span class="tag is-primary" v-if="member.id === owner"
                  >Owner</span
                >
              </div>
              <div class="member__id">ID: {{ member.id }}</div>
            </div>
            <!-- <div class="member__actions">
            <i
              class="fas fa-trash clickable"
              @click="deleteMember(member.id)"
            ></i>
          </div> -->
          </div>

          <div class="add-member">
            <input
              type="text"
              v-model="newUserId"
              placeholder="追加するユーザーID"
            />
            <i class="fas fa-plus fa-lg clickable" @click="addMember"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Repository from '@/repository'
import Avatar from '@/components/Avatar.vue'

export default {
  name: 'Room',
  components: {
    Avatar,
  },
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
