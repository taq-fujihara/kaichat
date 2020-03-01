import { db, serverTimestamp } from '@/firebaseApp'
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
    userPic: data.userPic,
    createdAt: data.createdAt,
    isLast: false,
  }
}
/**
 * バックエンドデータ管理
 */
export default class Repository {
  static async createUser(user: User) {
    let userDoc = await db.doc(`/users/${user.id}`).get()

    if (!userDoc.exists) {
      await db.doc(`/users/${user.id}`).set({
        name: user.name,
        userPic: user.userPic,
        defaultRoom: user.defaultRoom,
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
      userPic: userData.userPic,
      defaultRoom: userData.defaultRoom,
    }
  }

  /**
   * ユーザーのデフォルトルームを設定する
   *
   * TODO 最後に見た部屋にしようかと思っている、、、
   *
   * @param userId ユーザーID
   * @param roomId 部屋ID
   */
  static async setUsersDefaultRoom(userId: string, roomId: string) {
    await db.doc(`/users/${userId}`).update({
      defaultRoom: roomId,
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
      if (!userDoc.exists) throw new Error(`User not found: ${uid}`)
      const data = userDoc.data()
      if (!data) throw new Error()
      return {
        id: userDoc.id,
        name: data.name,
        userPic: data.userPic,
        defaultRoom: data.defaultRoom,
      }
    })

    return Promise.all(promises)
  }

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

  static onMessagesChange(
    roomId: string,
    callback: (messages: Array<ChatMessage>) => void,
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
        callback(messages)
      })
  }

  static async addMessage(roomId: string, message: ChatMessage): Promise<void> {
    try {
      await db.collection(`/rooms/${roomId}/messages`).add({
        ...message,
        createdAt: serverTimestamp(),
      })
    } catch (error) {
      throw new Error(`Failed to add message: ${error}`)
    }
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
