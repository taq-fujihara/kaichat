<template>
  <div class="wrapper">
    <div class="contents">
      <div class="title">ID</div>
      <div class="text">{{ roomId }}</div>

      <div class="title">名前</div>
      <div class="text">
        <input type="text" v-model="room.name" />
      </div>

      <div class="title">メンバー</div>
      <div class="text">
        <div v-for="member in room.members" :key="member">
          {{ member }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Repository from '@/repository'

export default {
  name: 'Room',
  props: {
    roomId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      room: {
        name: '',
        members: [],
        createdAt: '',
      },
    }
  },
  async mounted() {
    const room = await Repository.getRoom(this.roomId)
    this.room.name = room.name
    this.room.members = room.members
    this.room.createdAt = room.createdAt.toString()
  },
}
</script>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  justify-content: center;
}

.contents {
  width: 400px;
  color: #fff;
}

.title {
  font-size: small;
  margin-top: 32px;
}
</style>
