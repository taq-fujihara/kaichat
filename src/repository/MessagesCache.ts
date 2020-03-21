import Dexie from 'dexie'
import ChatMessage from '@/models/ChatMessage'

const DB_PREFIX = 'room:'

/**
 * チャットメッセージのキャッシュマネージャー
 */
export class MessagesCache extends Dexie {
  messages: Dexie.Table<ChatMessage, string>

  constructor(roomId: string) {
    super(DB_PREFIX + roomId)

    this.version(1).stores({
      messages: 'id, userId, createdAt',
    })

    this.messages = this.table('messages')
  }
}

/**
 * 全てのメッセージキャッシュを削除する
 */
export async function clearAll() {
  const databases = await Dexie.getDatabaseNames()
  const messageDatabases = databases.filter(dbName =>
    dbName.startsWith(DB_PREFIX),
  )
  await Promise.all(messageDatabases.map(dbName => Dexie.delete(dbName)))
}
