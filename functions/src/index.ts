import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { request } from "https";

admin.initializeApp();
const db = admin.firestore();

const FCM_HOST = "fcm.googleapis.com";
const FCM_PATH = "/fcm/send";
const FCM_KEY = functions.config().fcm.key;

const NOTIFICATION_TITLE = "新着メッセージ";

async function getUserPhotoURL(id: string) {
  const userDoc = await db.doc(`/users/${id}`).get();
  if (!userDoc.exists) {
    throw new Error(`User not found: ${id}`);
  }
  return userDoc.data()?.userPic;
}

function send(
  to: string,
  message: string,
  senderPhotoURL: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const r = request(
      {
        host: FCM_HOST,
        path: FCM_PATH,
        method: "POST",
        headers: {
          Authorization: `key=${FCM_KEY}`,
          "Content-Type": "application/json"
        }
      },
      res => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          console.log("ERRRR!", res.statusCode);
          reject();
        }
      }
    );

    r.on("error", error => {
      console.log("ERR!", error);
      reject();
    });

    r.write(
      JSON.stringify({
        to,
        // data: {
        notification: {
          title: NOTIFICATION_TITLE,
          body: message,
          icon: senderPhotoURL
        }
      })
    );

    r.end();
  });
}

export const sendNotification = functions.firestore
  .document("rooms/{roomId}/messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    const senderId = data?.userId;
    const senderPhotoURL = await getUserPhotoURL(senderId);
    const message = data?.text;

    const roomId = context.params.roomId;
    const roomDoc = await db.doc(`/rooms/${roomId}`).get();
    if (!roomDoc.exists) {
      throw new Error(`Room not found: ${roomId}`);
    }
    const roomMembers: string[] = roomDoc.data()?.members;
    const membersButMe = roomMembers.filter(m => m !== senderId);
    const notifyTo = await Promise.all(
      membersButMe.map(async userId => {
        const tokenDoc = await db.doc(`/fcmTokens/${userId}`).get();
        return tokenDoc.data()?.token;
      })
    );

    await Promise.all(notifyTo.map(to => send(to, message, senderPhotoURL)));
  });
