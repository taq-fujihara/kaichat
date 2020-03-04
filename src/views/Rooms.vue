<template>
  <div class="wrapper">
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
      <ChatMessage
        :text="chooseRoomText"
        avatar-background-color="blue"
        :is-next-me="true"
      />
      <ChatMessageMine>
        <div class="rooms">
          <div class="room" v-for="room in rooms" :key="room.id">
            <a href="#" @click.prevent="viewMessages(room)">
              {{ room.name }}
            </a>
          </div>
          <div v-if="rooms.length === 0">
            部屋がない…
          </div>
          <p>
            <a href="#" @click.prevent="newRoomDialogOpen = true">
              …新しく作る
            </a>
          </p>
          <div v-if="newRoomDialogOpen">
            <p>
              名前
              <input type="text" v-model="newRoom.name" />
            </p>
            <p>
              メンバー
              <input type="text" v-model="newMember" />
              <i class="fas fa-plus clickable" @click="addMember" />
            </p>
            <p>
              <span v-for="member in newRoom.members" :key="member">
                {{ member }}
              </span>
            </p>
            <p>
              <button
                class="button is-small is-primary"
                :disabled="!isNewRoomValid"
                :class="{ 'is-loading': creatingRoom }"
                @click="createRoom"
              >
                作成
              </button>
            </p>
          </div>
        </div>
      </ChatMessageMine>
    </div>
  </div>
</template>

<script>
import Repository from '@/repository'
import ChatMessage from '@/components/ChatMessage.vue'
import ChatMessageMine from '@/components/ChatMessageMine.vue'

export default {
  name: 'Rooms',
  components: {
    ChatMessage,
    ChatMessageMine,
  },
  data() {
    return {
      rooms: [],
      newRoomDialogOpen: false,
      newMember: '',
      newRoom: {
        name: '',
        members: [this.$store.state.user.id],
      },
      creatingRoom: false,
    }
  },
  computed: {
    chooseRoomText() {
      const index = Math.floor(Math.random() * 100) % 2
      return ['部屋を選べ！', 'どの部屋にするのですか？'][index]
    },
    isNewRoomValid() {
      return !!this.newRoom.name && this.newRoom.members.length > 0
    },
  },
  methods: {
    viewMessages(room) {
      this.$router.push({
        name: 'Messages',
        params: { roomId: room.id },
      })
    },
    addMember() {
      if (!this.newMember) {
        return
      }
      if (this.newRoom.members.includes(this.newMember)) {
        return
      }
      this.newRoom.members = [...this.newRoom.members, this.newMember]
      this.newMember = ''
    },
    async createRoom() {
      this.creatingRoom = true
      try {
        await Repository.createRoom(
          this.$store.state.user.id,
          this.newRoom.name,
          this.newRoom.members,
        )
      } catch (error) {
        this.creatingRoom = false
        throw new Error(error)
      }
      location.reload()
    },
  },
  async mounted() {
    this.rooms = await Repository.getRooms(this.$store.state.user.id)
  },
}
</script>

<style lang="scss" scoped>
$contents-width: 390px;

.wrapper {
  display: flex;
  justify-content: center;
}

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
  width: 100%;
  max-width: $contents-width;
}

.room {
  font-size: large;
  &:not(:first-child) {
    padding-top: 16px;
  }
}
</style>
