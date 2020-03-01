import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()
const db = admin.firestore()

async function getUser(id: string) {
  const userDoc = await db.doc(`/users/${id}`).get()
  if (!userDoc.exists) {
    throw new Error(`User not found: ${id}`)
  }

  const userData = userDoc.data()

  return {
    id: userDoc.id,
    userPic: userData?.userPic,
    name: userData?.name,
  }
}

async function send(
  recipientTokens: string[],
  message: string,
  senderName: string,
  senderPhotoURL: string,
  roomId: string,
): Promise<void> {
  await admin.messaging().sendMulticast({
    tokens: recipientTokens.filter(t => !!t),
    notification: {
      title: `${senderName}さんからメッセージが届きました`,
      body: message,
    },
    webpush: {
      notification: {
        icon: senderPhotoURL,
      },
      fcmOptions: {
        link: `/rooms/${roomId}/messages`,
      },
    },
  })
}

export const sendNotification = functions.firestore
  .document('rooms/{roomId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data()
    const senderId = data?.userId
    const message = data?.text
    const user = await getUser(senderId)

    const roomId = context.params.roomId
    const roomDoc = await db.doc(`/rooms/${roomId}`).get()
    if (!roomDoc.exists) {
      throw new Error(`Room not found: ${roomId}`)
    }
    const roomMembers: string[] = roomDoc.data()?.members
    const membersButMe = roomMembers.filter(m => m !== senderId)
    const notifyTo = await Promise.all(
      membersButMe.map(async userId => {
        const tokenDoc = await db.doc(`/fcmTokens/${userId}`).get()
        return tokenDoc.data()?.token
      }),
    )

    await send(notifyTo, message, user.name, user.userPic, roomId)
  })
