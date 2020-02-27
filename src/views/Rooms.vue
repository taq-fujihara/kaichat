<template>
  <div class="wrapper">
    <div class="contents">
      <ChatMessage :text="chooseRoomText" :is-next-me="true" />
      <ChatMessageMine :is-last="true">
        <div class="rooms">
          <div class="room" v-for="room in rooms" :key="room.id">
            <a href="#" @click.prevent="viewMessages(room)">
              {{ room.name }}
            </a>
          </div>
        </div>
      </ChatMessageMine>
    </div>
  </div>
</template>

<script>
import Repository from "@/repository";
import ChatMessage from "@/components/ChatMessage.vue";
import ChatMessageMine from "@/components/ChatMessageMine.vue";

export default {
  name: "Rooms",
  components: {
    ChatMessage,
    ChatMessageMine
  },
  data() {
    return {
      rooms: [],
      newRoom: {
        name: "",
        members: []
      }
    };
  },
  computed: {
    chooseRoomText() {
      return "部屋を選べ！";
    }
  },
  methods: {
    viewMessages(room) {
      this.$router.push({
        name: "Messages",
        params: { roomId: room.id }
      });
    }
  },
  async mounted() {
    this.rooms = await Repository.getRooms(this.$store.state.user.id);
  }
};
</script>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  justify-content: center;
}

.contents {
  width: 400px;
}

.room {
  font-size: large;
  &:not(:first-child) {
    padding-top: 16px;
  }
}
</style>
