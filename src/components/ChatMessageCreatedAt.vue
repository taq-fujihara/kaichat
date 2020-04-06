<template>
  <div class="chat-message__created-at">{{ displayText }}</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class ChatMessageCreatedAt extends Vue {
  @Prop({ required: true }) private createdAt!: Date

  private get displayText() {
    // 1年前とかちょっと凝りたいけど、どうせ今は表示件数制限とかあるからいいや、、、
    const month = this.createdAt.getMonth()
    const date = this.createdAt.getDate()
    const hour = this.createdAt.getHours()
    const minute = this.createdAt.getMinutes()
    return `${month}/${date} ${hour}:${minute}`
  }
}
</script>

<style lang="scss" scoped>
.chat-message__created-at {
  margin-top: var(--spacing-small);
  text-align: right;
  font-size: var(--font-size-xsmall);
  color: var(--app-color-gray);
}
</style>
