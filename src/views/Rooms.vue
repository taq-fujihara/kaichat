<template>
  <div>
    <app-header title="Rooms">
      <template v-slot:left>
        <i
          class="fas fa-cog clickable fa-lg"
          @click="$router.push('/settings')"
        ></i>
      </template>
    </app-header>

    <div class="app-body">
      <h2>
        参加している部屋
      </h2>
      <div>
        <div class="room" v-for="room in rooms" :key="room.id">
          <app-link href="#" @click.prevent="viewMessages(room)">
            {{ room.name }}
          </app-link>
        </div>
      </div>
      <div>
        <h2>
          新しい部屋
        </h2>
        <p>
          <app-input placeholder="部屋の名前" :value.sync="newRoom.name" />
        </p>

        <p class="sub-text">
          メンバー
        </p>
        <div>
          <UserProfile
            v-for="member in newRoom.members"
            :key="member.id"
            :user="member"
          />
        </div>
        <div class="input-with-buttons">
          <div class="input-with-buttons__input">
            <app-input placeholder="追加するユーザー" :value.sync="newMember" />
          </div>
          <div class="input-with-buttons__buttons">
            <app-button @click="addMember" :loading="loading">
              Add
            </app-button>
          </div>
        </div>
        <div class="actions">
          <app-button @click="createRoom">
            部屋を作る
          </app-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import UserProfile from '@/components/UserProfile.vue'
import Repository from '@/repository'
import { Room } from '@/models/Room'
import { Interceptor } from '@/utils/interceptor'

@Component({
  components: { UserProfile },
})
export default class Rooms extends Vue {
  rooms: Room[] = []
  newRoom = {
    name: '',
    members: [
      // 自身
      {
        id: this.$store.state.user.id,
        name: this.$store.state.user.name,
        photoUrl: this.$store.state.user.photoUrl,
      },
    ],
  }
  newMember = ''
  creatingRoom = false
  loading = false

  loadingInterceptor = new Interceptor(
    () => {
      this.loading = true
    },
    () => {
      this.loading = false
    },
  )

  async mounted() {
    this.rooms = await Repository.getRooms(this.$store.state.user.id)
  }

  viewMessages(room: Room) {
    this.$router.push({
      name: 'Messages',
      params: { roomId: room.id },
    })
  }

  async addMember() {
    const userId = this.newMember.trim()

    if (!userId) {
      return
    }
    if (this.newRoom.members.map(m => m.id).includes(userId)) {
      return
    }

    const user = await this.loadingInterceptor.call(() => {
      return Repository.getUserPublicData(userId)
    })

    if (!user) {
      alert('ユーザーが見つかりませんでした')
    } else {
      this.newRoom.members = [...this.newRoom.members, user]
      this.newMember = ''
    }
  }

  async createRoom() {
    if (!this.newRoom.name || this.newRoom.name.trim() === '') {
      return
    }

    this.creatingRoom = true
    try {
      const roomId = await Repository.createRoom(
        this.$store.state.user.id,
        this.newRoom.name,
        this.newRoom.members.map(m => m.id),
      )

      this.$router.push(`/rooms/${roomId}/messages`)
    } catch (error) {
      this.creatingRoom = false
      alert('部屋の作成に失敗しました')
      throw new Error(error)
    }
  }

  beforeDestroy() {
    this.loadingInterceptor.dispose()
  }
}
</script>

<style lang="scss" scoped>
.room {
  font-size: large;
  &:not(:first-child) {
    padding-top: 16px;
  }
}

.actions {
  margin-top: var(--spacing-medium);
}
</style>
