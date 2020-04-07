import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { spawn } from 'child-process-promise'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'

admin.initializeApp()
const db = admin.firestore()

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
      // data: {
      //   title: user.name,
      //   body: message,
      //   icon: user.photoUrl,
      //   room: roomId,
      // },
    })
  })

export const generateThumbnail = functions.storage
  .bucket('')
  .object()
  .onFinalize(async object => {
    const THUMBNAIL_PREFIX = '_thumb_'

    console.log('upload', object)

    const fileBucket = object.bucket // The Storage bucket that contains the file.
    const filePath = object.name // File path in the bucket.
    const contentType = object.contentType // File content type.
    // const metageneration = object.metageneration // Number of times metadata has been generated. New objects have a value of 1.

    if (!filePath) {
      console.log('file path not found.')
      return
    }

    // Exit if this is triggered on a file that is not an image.
    if (contentType && !contentType.startsWith('image/')) {
      console.log('This is not an image.')
      return
    }

    // Get the file name.
    const fileName = path.basename(filePath)
    // Exit if the image is already a thumbnail.
    if (fileName.startsWith(THUMBNAIL_PREFIX)) {
      console.log('Already a Thumbnail.')
      return
    }
    // Download file from bucket.
    const bucket = admin.storage().bucket(fileBucket)
    const tempFilePath = path.join(os.tmpdir(), fileName)
    const metadata = {
      contentType: contentType,
    }
    await bucket.file(filePath).download({ destination: tempFilePath })
    console.log('Image downloaded locally to', tempFilePath)
    // Generate a thumbnail using ImageMagick.
    await spawn('convert', [
      tempFilePath,
      '-thumbnail',
      '200x200>',
      tempFilePath,
    ])
    console.log('Thumbnail created at', tempFilePath)
    // We add a prefix to thumbnails file name. That's where we'll upload the thumbnail.
    const thumbFileName = `${THUMBNAIL_PREFIX}${fileName}`
    const thumbFilePath = path.join(path.dirname(filePath), thumbFileName)
    // Uploading the thumbnail.
    await bucket.upload(tempFilePath, {
      destination: thumbFilePath,
      metadata,
    })
    // Once the thumbnail has been uploaded delete the local file to free up disk space.
    fs.unlinkSync(tempFilePath)

    // update message document
    const meta = object.metadata
    if (meta) {
      console.log(`update document; ${meta.roomId} ${meta.messageId}`)

      await db.doc(`/rooms/${meta.roomId}/messages/${meta.messageId}`).update({
        imageThumbnailPath: thumbFilePath,
      })
    }
  })
