<template>
  <div>
    <div class="header">
      <div class="header-contents-right"></div>
      <div class="header-contents-left">
        <div>
          <i
            class="fas fa-cog clickable fa-lg"
            @click="$router.push('/settings')"
          ></i>
        </div>
      </div>
    </div>

    <div class="contents">
      <div class="rooms">
        <div class="room" v-for="room in rooms" :key="room.id">
          <app-link href="#" @click.prevent="viewMessages(room)">
            {{ room.name }}
          </app-link>
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
          <div class="members">
            <div>
              <UserProfile
                v-for="member in newRoom.members"
                :key="member.id"
                :user="member"
              />
            </div>
          </div>
          <div class="input-with-buttons">
            <div class="input-with-buttons__input">
              <app-input
                placeholder="追加するユーザー"
                :value.sync="newMember"
              />
            </div>
            <div class="input-with-buttons__buttons">
              <app-button @click="addMember">
                追加
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
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import UserProfile from '@/components/UserProfile.vue'
import Repository from '@/repository'
import { Room } from '@/models/Room'

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
    if (!this.newMember) {
      return
    }
    if (this.newRoom.members.map(m => m.id).includes(this.newMember)) {
      return
    }

    const userId = this.newMember.trim()

    const user = await Repository.getUserPublicData(userId)
    this.newRoom.members = [...this.newRoom.members, user]

    this.newMember = ''
  }

  async createRoom() {
    // validate
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
}
</script>

<style lang="scss" scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 8px;

  display: flex;

  color: #fff;
  opacity: 0.9;

  .header-contents-right {
    flex: 1;
  }

  .header-contents-left {
    display: flex;
  }
}

.contents {
  margin-top: var(--spacing-xlarge);
}

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
