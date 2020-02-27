/* eslint-disable-next-line */
const firebase = require("@firebase/testing");

const PROJECT_ID = "local-emulator";
const USER_ID = "somebody";

const db = firebase.initializeAdminApp({ projectId: PROJECT_ID }).firestore();

// Rooms
async function createRooms() {
  ["sample1", "sample2", "sample3"].forEach(async name => {
    await db.collection("/rooms").add({
      name,
      members: [USER_ID],
      createdAt: new Date()
    });
  });
}

// Users
async function createUsers() {
  const rooms = await db.collection("/rooms").get();
  const roomRefs = [];
  rooms.forEach(doc => {
    roomRefs.push(doc.ref);
  });

  await db.doc(`/users/${USER_ID}`).set({
    rooms: roomRefs
  });
}

async function main() {
  await createRooms();
  await createUsers();
  console.log("done");
}

main();
