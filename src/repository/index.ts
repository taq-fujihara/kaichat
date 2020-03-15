import { db, functions, serverTimestamp, arrayUnion } from '@/firebaseApp'
import ChatMessage from '@/models/ChatMessage'
import { Room } from '@/models/Room'
import { User } from '@/models/User'

/**
 * 表示できる直近のメッセージ数
 */
const CHAT_MESSAGE_LIMIT = 30

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
    createdAt: data.createdAt?.toDate(), // サーバー時刻はまだ入っていないことがある
  }
}
/**
 * バックエンドデータ管理
 */
export default class Repository {
  static get chatMessageLimit(): number {
    return CHAT_MESSAGE_LIMIT
  }

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
   * @param roomId
   */
  static async getRoomMembers(roomId: string): Promise<User[]> {
    const f = await functions.httpsCallable('getRoomMembers')({ roomId })
    return f.data
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
      .onSnapshot(async snapshot => {
        const messages = new Array<ChatMessage>()
        snapshot.forEach(doc => {
          const model = docToChatMessageModel(doc)
          if (model.createdAt) {
            messages.push(docToChatMessageModel(doc))
          }
        })

        messages.reverse()

        onNext(messages)
      })
  }

  static async onMessagesChangeFrom(
    roomId: string,
    messageId: string,
    onNext: (messages: Array<ChatMessage>) => void,
  ) {
    const doc = await db.doc(`/rooms/${roomId}/messages/${messageId}`).get()

    return db
      .collection(`/rooms/${roomId}/messages`)
      .orderBy('createdAt', 'desc')
      .endBefore(doc)
      .limit(CHAT_MESSAGE_LIMIT)
      .onSnapshot(async snapshot => {
        const messages = new Array<ChatMessage>()
        snapshot.forEach(doc => {
          const model = docToChatMessageModel(doc)
          if (model.createdAt) {
            messages.push(model)
          }
        })

        messages.reverse()

        onNext(messages)
      })
  }

  static async addMessage(
    roomId: string,
    userId: string,
    text: string,
  ): Promise<void> {
    await db.collection(`/rooms/${roomId}/messages`).add({
      userId,
      text,
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
