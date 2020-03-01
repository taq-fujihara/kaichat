import * as firebase from '@firebase/testing'

const PROJECT_ID = 'firestore-emulator-example'
const UID = 'test'

// **********************************
// Firestore helpers
// **********************************

function getAdminApp() {
  return firebase.initializeAdminApp({ projectId: PROJECT_ID }).firestore()
}

function getAuthedApp() {
  return firebase
    .initializeTestApp({
      projectId: PROJECT_ID,
      auth: {
        uid: UID,
        email: 'test@example.com',
      },
    })
    .firestore()
}

function getUnAuthedApp() {
  return firebase.initializeTestApp({ projectId: PROJECT_ID }).firestore()
}

function clearFirestoreData() {
  return firebase.clearFirestoreData({ projectId: PROJECT_ID })
}

/* eslint-disable-next-line */
async function assertSucceeds(pr: Promise<any>, done: jest.DoneCallback) {
  try {
    await firebase.assertSucceeds(pr)
    done()
  } catch (error) {
    done(error)
  }
}

/* eslint-disable-next-line */
async function assertFails(pr: Promise<any>, done: jest.DoneCallback) {
  try {
    await firebase.assertFails(pr)
    done()
  } catch (error) {
    done(error)
  }
}

async function addRoomDocument(data: object) {
  const admin = getAdminApp()
  const doc = await admin.collection(`/rooms`).add(data)
  return doc.id
}

async function addMessageDocument(roomId: string, data: object) {
  const admin = getAdminApp()
  const doc = await admin.collection(`/rooms/${roomId}/messages`).add(data)
  return doc.id
}

// **********************************
// Tests
// **********************************

describe('Users', () => {
  beforeEach(clearFirestoreData)

  test('Allow read if self', async done => {
    const user = getAuthedApp().doc(`/users/${UID}`)
    assertSucceeds(user.get(), done)
  })

  test('Deny read if not self', async done => {
    const user = getAuthedApp().doc(`/users/somebodyelse`)
    assertFails(user.get(), done)
  })

  test('Deny read if not authed', async done => {
    const user = getUnAuthedApp().doc(`/users/${UID}`)
    assertFails(user.get(), done)
  })
})

describe('Rooms', () => {
  beforeEach(clearFirestoreData)

  test('Allow create if owner is self', async done => {
    const rooms = getAuthedApp().collection('/rooms')
    assertSucceeds(rooms.add({ owner: UID }), done)
  })

  test('Deny create if owner is not self', async done => {
    const rooms = getAuthedApp().collection('/rooms')
    assertFails(rooms.add({ owner: UID + 'somebody else' }), done)
  })

  test('Deny create if not authed', async done => {
    const rooms = getUnAuthedApp().collection('/rooms')
    assertFails(rooms.add({ owner: UID }), done)
  })

  test('Allow update if owner is self', async done => {
    const roomId = await addRoomDocument({ owner: UID })
    const room = getAuthedApp().doc(`/rooms/${roomId}`)
    assertSucceeds(room.update({ members: [UID] }), done)
  })

  test('Deny update if owner is not self', async done => {
    const roomId = await addRoomDocument({ owner: 'somebody else' })
    const room = getAuthedApp().doc(`/rooms/${roomId}`)
    assertFails(room.update({ members: [UID] }), done)
  })

  test('Deny update if not authed', async done => {
    const roomId = await addRoomDocument({ owner: UID })
    const docRef = getUnAuthedApp().doc(`/rooms/${roomId}`)
    assertFails(docRef.update({ members: [UID] }), done)
  })

  test('Allow read if a member of the room', async done => {
    const roomId = await addRoomDocument({ members: ['userA', 'userB', UID] })
    const room = getAuthedApp().doc(`/rooms/${roomId}`)
    assertSucceeds(room.get(), done)
  })

  test('Deny read if not a member of the room', async done => {
    const roomId = await addRoomDocument({ members: ['userA', 'userB'] })
    const room = getAuthedApp().doc(`/rooms/${roomId}`)
    assertFails(room.get(), done)
  })

  test('Deny read if not authed', async done => {
    const roomId = await addRoomDocument({ members: ['userA', 'userB', UID] })
    const room = getUnAuthedApp().doc(`/rooms/${roomId}`)
    assertFails(room.get(), done)
  })
})

describe('Messages', () => {
  beforeEach(clearFirestoreData)

  test('Allow create if a member of the room', async done => {
    const roomId = await addRoomDocument({ members: ['userA', 'userB', UID] })
    const messages = getAuthedApp().collection(`/rooms/${roomId}/messages`)
    assertSucceeds(messages.add({ userId: UID }), done)
  })

  test('Deny create if not a member of the room', async done => {
    const roomId = await addRoomDocument({ members: ['userA', 'userB'] })
    const messages = getAuthedApp().collection(`/rooms/${roomId}/messages`)
    assertFails(messages.add({ userId: UID }), done)
  })

  test('Deny create if user is not self', async done => {
    const roomId = await addRoomDocument({ members: ['userA', 'userB', UID] })
    const messages = getAuthedApp().collection(`/rooms/${roomId}/messages`)
    assertFails(messages.add({ userId: 'somebody else' }), done)
  })

  test('Deny create if not authed', async done => {
    const roomId = await addRoomDocument({ members: ['userA', 'userB', UID] })
    const messages = getUnAuthedApp().collection(`/rooms/${roomId}/messages`)
    assertFails(messages.add({ userId: UID }), done)
  })

  test('Allow read if a member of the room', async done => {
    const roomId = await addRoomDocument({ members: ['userA', 'userB', UID] })
    const messages = getAuthedApp().collection(`/rooms/${roomId}/messages`)
    assertSucceeds(messages.get(), done)
  })

  test('Deny read if not a member of the room', async done => {
    const roomId = await addRoomDocument({ members: ['userA', 'userB'] })
    const messages = getAuthedApp().collection(`/rooms/${roomId}/messages`)
    assertFails(messages.get(), done)
  })

  test('Deny read if not authed', async done => {
    const roomId = await addRoomDocument({ members: ['userA', 'userB', UID] })
    const messages = getUnAuthedApp().collection(`/rooms/${roomId}/messages`)
    assertFails(messages.get(), done)
  })

  test('Unable to modify', async done => {
    const roomId = await addRoomDocument({ members: ['userA', 'userB', UID] })
    const messageId = await addMessageDocument(roomId, { userId: UID })
    const message = getAuthedApp().doc(`/rooms/${roomId}/messages/${messageId}`)
    assertFails(message.update({ text: 'test' }), done)
  })

  test('Unable to delete', async done => {
    const roomId = await addRoomDocument({ members: ['userA', 'userB', UID] })
    const messageId = await addMessageDocument(roomId, { userId: UID })
    const message = getAuthedApp().doc(`/rooms/${roomId}/messages/${messageId}`)
    assertFails(message.delete(), done)
  })
})
