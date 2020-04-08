import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { v4 as uuid } from 'uuid'
import { spawn } from 'child-process-promise'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'

admin.initializeApp()
const db = admin.firestore()
const storage = admin.storage()

async function getUser(id: string) {
  const userDoc = await db.doc(`/users/${id}`).get()
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', id)
  }

  const userData = userDoc.data()

  return {
    id: userDoc.id,
    photoUrl: userData?.photoUrl,
    name: userData?.name,
  }
}

/**
 * 部屋メンバー一覧を取得する
 *
 * TODO 順番が保証されていない
 */
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

/**
 * ユーザーの公開情報取得
 */
export const getUserPublicData = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new Error('Requires login to call this function')
    }
    return getUser(data.userId)
  },
)

/**
 * 新着メッセージ通知
 */
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
    const recipientTokens = (
      await Promise.all(
        membersButMe.map(async userId => {
          const tokenDoc = await db.doc(`/fcmTokens/${userId}`).get()
          return tokenDoc.data()?.token
        }),
      )
    ).filter(token => !!token) // そもそもトークンが見つからない場合は対象にしない

    if (recipientTokens.length === 0) {
      return
    }

    // 通知の送信
    await admin.messaging().sendMulticast({
      tokens: recipientTokens,
      notification: {
        title: user.name,
        body: message,
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          icon: user.photoUrl,
          tag: roomId,
          badge: '/img/badges/badge-128x128.png',
          renotify: true,
        },
        fcmOptions: {
          link: `/rooms/${roomId}/messages`,
        },
      },
    })
  })

export const addImageMessage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'signin required')
  }

  const THUMBNAIL_PREFIX = '__thumb__'
  const userId = context.auth.uid
  const roomId = data.roomId
  const originalFilename = data.filename
  const tmpImageId = uuid()
  const dataUrl: string = data.fileContent
  const tempFilePath = path.join(os.tmpdir(), originalFilename)
  const originalStorageFilePath = `images/${roomId}/${tmpImageId}/${originalFilename}`
  const thumbnailStorageFilePath = `images/${roomId}/${tmpImageId}/${THUMBNAIL_PREFIX}${originalFilename}`

  const roomDoc = await db.doc(`/rooms/${roomId}`).get()
  const room = roomDoc.data()
  if (!room) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Room not found: ${roomId}`,
    )
  }

  const roomMembers: string[] = room.members

  if (!roomMembers.includes(userId)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      `You are not allowed to fetch members of this room: ${roomId}`,
    )
  }

  const match = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
  const base64Header = `data:${match ? match[1] : 'image/jpeg'};base64,`
  const fileContent = match ? match[2] : null

  if (!fileContent) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid file content',
    )
  }

  // save image
  fs.writeFileSync(tempFilePath, fileContent, 'base64')

  // upload the original
  await storage.bucket().upload(tempFilePath, {
    destination: originalStorageFilePath,
  })

  // generate a thumbnail
  await spawn('convert', [tempFilePath, '-thumbnail', '300x300>', tempFilePath])
  const thumbnailBase64 = fs.readFileSync(tempFilePath).toString('base64')

  // upload the thumbnail
  await storage.bucket().upload(tempFilePath, {
    destination: thumbnailStorageFilePath,
  })

  fs.unlinkSync(tempFilePath)

  // add chat message
  await db.collection(`/rooms/${data.roomId}/messages`).add({
    type: 'image',
    userId,
    imagePath: originalStorageFilePath,
    imageThumbnailPath: thumbnailStorageFilePath,
    thumbnailBase64: base64Header + thumbnailBase64,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })
})
