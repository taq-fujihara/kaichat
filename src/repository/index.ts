import { db, serverTimestamp } from "@/firebaseApp";
import ChatMessage from "@/models/ChatMessage";
import { Room } from "@/models/Room";
import { User } from "@/models/User";

/**
 * 表示できる直近のメッセージ数
 */
const CHAT_MESSAGE_LIMIT = 30;

type DocumentSnapshot = firebase.firestore.DocumentSnapshot<
  firebase.firestore.DocumentData
>;

/**
 * チャットルームのドキュメント->モデル変換
 * @param docRef
 */
function docToRoomModel(docRef: DocumentSnapshot): Room {
  const data = docRef.data();
  if (!data) {
    throw new Error("Failed to retrieve data");
  }
  return {
    id: docRef.id,
    name: data.name,
    members: data.members,
    createdAt: data.createdAt
  };
}

/**
 * チャットメッセージのドキュメント->モデル変換
 * @param docRef
 */
function docToChatMessageModel(docRef: DocumentSnapshot): ChatMessage {
  const data = docRef.data();
  if (!data) {
    throw new Error("Failed to retrieve data");
  }
  return {
    id: docRef.id,
    text: data.text,
    userId: data.userId,
    nextUserId: undefined,
    userPic: data.userPic,
    createdAt: data.createdAt,
    isLast: false
  };
}
/**
 * バックエンドデータ管理
 */
export default class Repository {
  static async createUser(user: User) {
    let userDoc = await db.doc(`/users/${user.id}`).get();

    if (!userDoc.exists) {
      await db.doc(`/users/${user.id}`).set({
        name: user.name,
        userPic: user.userPic,
        defaultRoom: user.defaultRoom
      });

      userDoc = await db.doc(`/users/${user.id}`).get();
    }

    const userData = userDoc.data();

    if (!userData) {
      throw new Error("Failed to find user document");
    }

    return {
      id: userDoc.id,
      name: userData.name,
      userPic: userData.userPic,
      defaultRoom: userData.defaultRoom
    };
  }

  static async createRoom(room: Room) {
    await db.collection("/rooms").add({
      name: room.name,
      members: room.members,
      createdAt: serverTimestamp()
    });
  }

  static async getRooms(userId: string) {
    const roomsRef = await db
      .collection(`/rooms`)
      .where("members", "array-contains", userId)
      .orderBy("createdAt", "desc")
      .get();

    const rooms = new Array<Room>();

    roomsRef.forEach(doc => {
      rooms.push(docToRoomModel(doc));
    });

    return rooms;
  }

  static onMessagesChange(
    roomId: string,
    callback: (messages: Array<ChatMessage>) => void
  ): () => void {
    return db
      .collection(`/rooms/${roomId}/messages`)
      .orderBy("createdAt", "desc")
      .limit(CHAT_MESSAGE_LIMIT)
      .onSnapshot(snapshot => {
        const messages = new Array<ChatMessage>();
        snapshot.forEach(doc => {
          messages.push(docToChatMessageModel(doc));
        });
        callback(messages);
      });
  }

  static async addMessage(roomId: string, message: ChatMessage): Promise<void> {
    try {
      await db.collection(`/rooms/${roomId}/messages`).add({
        ...message,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error(`Failed to add message: ${error}`);
    }
  }
}
