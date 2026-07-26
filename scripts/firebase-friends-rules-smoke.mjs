import assert from "node:assert/strict";
import { deleteApp, initializeApp } from "firebase/app";
import {
    connectAuthEmulator,
    createUserWithEmailAndPassword,
    getAuth,
} from "firebase/auth";
import {
    collection,
    connectFirestoreEmulator,
    doc,
    endAt,
    getDoc,
    getDocs,
    getFirestore,
    limit,
    orderBy,
    query,
    setDoc,
    setLogLevel,
    startAt,
    updateDoc,
    where,
} from "firebase/firestore";

setLogLevel("silent");

const createClient = async (name, email) => {
    const app = initializeApp({
        apiKey: "demo-key",
        authDomain: "hand-and-foot-app.firebaseapp.com",
        projectId: "hand-and-foot-app",
        appId: `friends-rules-${name}`,
    }, `friends-rules-${name}`);
    const auth = getAuth(app);
    const db = getFirestore(app);

    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);

    const credential = await createUserWithEmailAndPassword(auth, email, "password123");
    return { app, db, uid: credential.user.uid };
};

const expectPermissionDenied = async (operation, description) => {
    await assert.rejects(
        operation,
        (error) => error?.code === "permission-denied",
        description,
    );
};

const owner = await createClient("owner", "owner@example.com");
const recipient = await createClient("recipient", "recipient@example.com");

const ownerPlayer = {
    id: 1,
    uid: owner.uid,
    ownerUid: owner.uid,
    nickName: "Owner",
    fullName: "Private Owner Name",
    email: "owner@example.com",
    isGuest: false,
};
const recipientPlayer = {
    id: 2,
    uid: recipient.uid,
    ownerUid: recipient.uid,
    nickName: "Recipient",
    fullName: "Private Recipient Name",
    email: "recipient@example.com",
    isGuest: false,
};

await setDoc(doc(owner.db, "players", owner.uid), ownerPlayer);
await setDoc(doc(recipient.db, "players", recipient.uid), recipientPlayer);
await updateDoc(doc(owner.db, "players", owner.uid), { nickName: "Owner Updated" });

await expectPermissionDenied(
    () => getDoc(doc(owner.db, "players", recipient.uid)),
    "Private player documents must remain owner-only.",
);

const ownerDirectory = {
    id: 1,
    ownerUid: owner.uid,
    nickName: "Owner Updated",
    nickNameNormalized: "owner updated",
    publicTag: "OWN1234",
    publicTagNormalized: "own1234",
};
const recipientDirectory = {
    id: 2,
    ownerUid: recipient.uid,
    nickName: "Recipient",
    nickNameNormalized: "recipient",
    publicTag: "REC1234",
    publicTagNormalized: "rec1234",
};

await setDoc(doc(owner.db, "playerDirectory", owner.uid), ownerDirectory);
await setDoc(doc(recipient.db, "playerDirectory", recipient.uid), recipientDirectory);
await updateDoc(doc(owner.db, "playerDirectory", owner.uid), {
    nickName: "Owner",
    nickNameNormalized: "owner",
});

await expectPermissionDenied(
    () => setDoc(doc(recipient.db, "playerDirectory", "not-the-auth-uid"), recipientDirectory),
    "A player must not create extra public-directory identities.",
);
await expectPermissionDenied(
    () => getDocs(collection(owner.db, "playerDirectory")),
    "Public-directory list reads must remain limited.",
);

const nicknameSearch = await getDocs(query(
    collection(recipient.db, "playerDirectory"),
    orderBy("nickNameNormalized"),
    startAt("ow"),
    endAt("ow\uf8ff"),
    limit(20),
));
const tagSearch = await getDocs(query(
    collection(owner.db, "playerDirectory"),
    orderBy("publicTagNormalized"),
    startAt("rec"),
    endAt("rec\uf8ff"),
    limit(20),
));

assert.equal(nicknameSearch.size, 1, "Nickname directory search should return the matching player.");
assert.equal(tagSearch.size, 1, "Tag directory search should return the matching player.");

await setDoc(doc(owner.db, "friendRequests", `${owner.uid}_1_2`), {
    id: 1,
    ownerUid: owner.uid,
    playerId: 1,
    friendId: 2,
    recipientUid: recipient.uid,
    participantUids: [owner.uid, recipient.uid],
});

const sentRequests = await getDocs(query(
    collection(owner.db, "friendRequests"),
    where("ownerUid", "==", owner.uid),
));
const incomingRequests = await getDocs(query(
    collection(recipient.db, "friendRequests"),
    where("recipientUid", "==", recipient.uid),
));

assert.equal(sentRequests.size, 1, "The sender should be able to list sent friend requests.");
assert.equal(incomingRequests.size, 1, "The recipient should be able to list incoming friend requests.");

const friendshipRef = doc(recipient.db, "friendships", `${recipient.uid}_1-2`);
await setDoc(friendshipRef, {
    id: 1,
    ownerUid: recipient.uid,
    playerId: 2,
    friendId: 1,
    participantUids: [owner.uid, recipient.uid],
    participantUid1: owner.uid,
    participantUid2: recipient.uid,
});

const ownedFriendships = await getDocs(query(
    collection(recipient.db, "friendships"),
    where("ownerUid", "==", recipient.uid),
));
const ownerFriendships = await getDocs(query(
    collection(owner.db, "friendships"),
    where("participantUid1", "==", owner.uid),
));
const recipientFriendships = await getDocs(query(
    collection(recipient.db, "friendships"),
    where("participantUid2", "==", recipient.uid),
));
const directFriendship = await getDoc(doc(owner.db, "friendships", friendshipRef.id));

assert.equal(ownedFriendships.size, 1, "The owner should be able to list owned friendships for legacy backfill.");
assert.equal(ownerFriendships.size, 1, "The first participant should be able to list friendships.");
assert.equal(recipientFriendships.size, 1, "The second participant should be able to list friendships.");
assert.equal(directFriendship.exists(), true, "A participant should be able to read a friendship directly.");

await Promise.all([deleteApp(owner.app), deleteApp(recipient.app)]);

console.log("Firebase Friends rules smoke test passed.");
