import { db, serverTimestamp, arrayUnion } from '@/firebaseApp'
import ChatMessage from '@/models/ChatMessage'
import { Room } from '@/models/Room'
import { User } from '@/models/User'

/**
 * 表示できる直近のメッセージ数
 */
const CHAT_MESSAGE_LIMIT = 50

type DocumentSnapshot = firebase.firestore.DocumentSnapshot<
  firebase.firestore.DocumentData
>

/**
 * チャットルームのドキュメント->モデル変換
 * @param docRef
 */
function docToRoomModel(docRef: DocumentSnapshot): Room {
  const data = docRef.data()
  if (!data) {
    throw new Error('Failed to retrieve data')
  }
  return {
    id: docRef.id,
    name: data.name,
    owner: data.owner,
    members: data.members,
    createdAt: data.createdAt,
  }
}

/**
 * チャットメッセージのドキュメント->モデル変換
 * @param docRef
 */
function docToChatMessageModel(docRef: DocumentSnapshot): ChatMessage {
  const data = docRef.data()
  if (!data) {
    throw new Error('Failed to retrieve data')
  }
  return {
    id: docRef.id,
    text: data.text,
    userId: data.userId,
    nextUserId: undefined,
    photoUrl: data.photoUrl,
    createdAt: data.createdAt,
    isLast: false,
  }
}
/**
 * バックエンドデータ管理
 */
export default class Repository {
  static async getUser(user: User) {
    let userDoc = await db.doc(`/users/${user.id}`).get()

    if (!userDoc.exists) {
      await db.doc(`/users/${user.id}`).set({
        name: user.name,
        photoUrl: user.photoUrl,
        lastRoom: user.lastRoom,
      })

      userDoc = await db.doc(`/users/${user.id}`).get()
    }

    const userData = userDoc.data()

    if (!userData) {
      throw new Error('Failed to find user document')
    }

    return {
      id: userDoc.id,
      name: userData.name,
      photoUrl: userData.photoUrl,
      lastRoom: userData.lastRoom,
    }
  }

  /**
   * ユーザーが最後に訪れた部屋を保存する
   *
   * @param userId ユーザーID
   * @param roomId 部屋ID
   */
  static async saveUsersLastRoom(userId: string, roomId: string) {
    await db.doc(`/users/${userId}`).update({
      lastRoom: roomId,
    })
  }

  static async createRoom(owner: string, name: string, members: Array<string>) {
    await db.collection('/rooms').add({
      owner,
      name,
      members,
      createdAt: serverTimestamp(),
    })
  }

  static async getRoom(id: string): Promise<Room> {
    const roomDoc = await db.doc(`/rooms/${id}`).get()

    if (!roomDoc.exists) {
      throw new Error(`Room not found: ${id}`)
    }

    const data = roomDoc.data()

    if (!data) {
      throw new Error('Room data not found')
    }

    return {
      id: roomDoc.id,
      name: data.name,
      owner: data.owner,
      members: data.members,
      createdAt: data.createdAt,
    }
  }

  /**
   * 部屋のメンバーを取得する
   *
   * TODO Roomsコレクションではメンバー（ユーザー）の一覧はUIDの
   * 配列でしか保持していないので、UID毎にUsersコレクションから
   * ヒットしている。あまり効率が良くないので追々考える。
   *
   * @param id
   */
  static async getRoomMembers(id: string) {
    const room = await Repository.getRoom(id)
    const memberUids = room.members

    const promises = memberUids.map(async uid => {
      const userDoc = await db.doc(`/users/${uid}`).get()
      if (!userDoc.exists) return undefined
      const data = userDoc.data()
      if (!data) throw new Error()
      return {
        id: userDoc.id,
        name: data.name,
        photoUrl: data.photoUrl,
        lastRoom: data.lastRoom,
      }
    })

    const members = await Promise.all(promises)
    return members.filter(m => m !== undefined) as Array<User>
  }

  /**
   * 所属する部屋一覧を取得する
   *
   * @param userId ユーザーID
   */
  static async getRooms(userId: string) {
    const roomsRef = await db
      .collection(`/rooms`)
      .where('members', 'array-contains', userId)
      .orderBy('createdAt', 'desc')
      .get()

    const rooms = new Array<Room>()

    roomsRef.forEach(doc => {
      rooms.push(docToRoomModel(doc))
    })

    return rooms
  }

  static async addMember(roomId: string, userId: string) {
    const room = await db.doc(`/rooms/${roomId}`)
    room.update({
      members: arrayUnion(userId),
    })
  }

  static onMessagesChange(
    roomId: string,
    onNext: (messages: Array<ChatMessage>) => void,
  ): () => void {
    return db
      .collection(`/rooms/${roomId}/messages`)
      .orderBy('createdAt', 'desc')
      .limit(CHAT_MESSAGE_LIMIT)
      .onSnapshot(snapshot => {
        const messages = new Array<ChatMessage>()
        snapshot.forEach(doc => {
          messages.push(docToChatMessageModel(doc))
        })
        onNext(messages)
      })
  }

  static async addMessage(roomId: string, message: ChatMessage): Promise<void> {
    await db.collection(`/rooms/${roomId}/messages`).add({
      ...message,
      createdAt: serverTimestamp(),
    })
  }

  static async setToken(userId: string, token: string): Promise<void> {
    try {
      await db.doc(`/fcmTokens/${userId}`).set({
        token,
        createdAt: serverTimestamp(),
      })
    } catch (error) {
      throw new Error(`Failed to save token: ${error}`)
    }
  }
}
