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
    photoUrl: userData?.photoUrl,
    name: userData?.name,
  }
}

async function send(
  recipientTokens: string[],
  message: string,
  senderName: string,
  senderphotoUrl: string,
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
        icon: senderphotoUrl,
      },
      fcmOptions: {
        link: `/rooms/${roomId}/messages`,
      },
    },
  })
}

export const getRoomMembers = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new Error('Requires login to call this function')
  }

  const requestUserId = context.auth.uid
  const roomId = data.roomId
  const roomDoc = await db.doc(`/rooms/${roomId}`).get()
  const room = roomDoc.data()
  if (!room) {
    throw new Error(`Room not found: ${roomId}`)
  }

  const roomMembers: string[] = room.members

  if (!roomMembers.includes(requestUserId)) {
    throw new Error(
      `You are not allowed to fetch members of this room: ${roomId}`,
    )
  }

  const members: {
    id: string
    name: string
    photoUrl: string
  }[] = await Promise.all(
    roomMembers.map(async userId => {
      const userDoc = await db.doc(`/users/${userId}`).get()
      const user = userDoc.data()
      if (!user) {
        return {
          id: userDoc.id,
          name: '',
          photoUrl: '',
        }
      }
      return {
        id: userDoc.id,
        name: user.name,
        photoUrl: user.photoUrl,
      }
    }),
  )

  const onlyPublicProperties = (member: {
    id: string
    name: string
    photoUrl: string
  }) => ({
    id: member.id,
    photoUrl: member.photoUrl,
    name: member.name,
  })

  return members.map(onlyPublicProperties)
})

export const sendNotification = functions.firestore
  .document('/rooms/{roomId}/messages/{messageId}')
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

    if (notifyTo.length > 0) {
      await send(notifyTo, message, user.name, user.photoUrl, roomId)
    }
  })
