import Dexie from 'dexie'
import ChatMessage from '@/models/ChatMessage'

export class MessagesCache extends Dexie {
  messages: Dexie.Table<ChatMessage, string>

  constructor(roomId: string) {
    super(roomId)
    this.version(1).stores({
      messages: 'id, userId, createdAt',
    })
    this.messages = this.table('messages')
  }
}
