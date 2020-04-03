import Dexie from 'dexie'
import { User } from '@/models/User'

const DB_PREFIX = 'members:'

/**
 * 部屋メンバーのキャッシュマネージャー
 */
export class MembersCache extends Dexie {
  users: Dexie.Table<User, string>

  constructor(roomId: string) {
    super(DB_PREFIX + roomId)

    this.version(1).stores({
      users: 'id',
    })

    this.users = this.table('users')
  }
}

/**
 * キャッシュを削除する
 */
export async function clearAll() {
  const databases = await Dexie.getDatabaseNames()
  const messageDatabases = databases.filter(dbName =>
    dbName.startsWith(DB_PREFIX),
  )
  await Promise.all(messageDatabases.map(dbName => Dexie.delete(dbName)))
}
