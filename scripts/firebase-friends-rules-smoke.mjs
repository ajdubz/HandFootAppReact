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
const outsider = await createClient("outsider", "outsider@example.com");

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
const outsiderPlayer = {
    id: 3,
    uid: outsider.uid,
    ownerUid: outsider.uid,
    nickName: "Outsider",
    fullName: "Private Outsider Name",
    email: "outsider@example.com",
    isGuest: false,
};

await setDoc(doc(owner.db, "players", owner.uid), ownerPlayer);
await setDoc(doc(recipient.db, "players", recipient.uid), recipientPlayer);
await setDoc(doc(outsider.db, "players", outsider.uid), outsiderPlayer);
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

await setDoc(doc(owner.db, "games", "game-10"), {
    id: 10,
    ownerUid: owner.uid,
    participantUids: [owner.uid, recipient.uid],
    date: new Date().toISOString(),
    rules: {},
    teamIds: [20, 21],
    memberPlayerIds: [1, 2],
});
await setDoc(doc(owner.db, "gameAccess", `game-10-participant-${recipient.uid}`), {
    gameId: 10,
    ownerUid: owner.uid,
    participantUid: recipient.uid,
});
await updateDoc(doc(owner.db, "games", "game-10"), {
    accessProvisionedUids: [owner.uid, recipient.uid],
});
await setDoc(doc(owner.db, "gameTeams", "gameTeam-30"), {
    id: 30,
    ownerUid: owner.uid,
    gameId: 10,
    teamId: 20,
    teamName: "Owner",
    memberPlayerIds: [1],
});
await setDoc(doc(owner.db, "gameTeams", "gameTeam-31"), {
    id: 31,
    ownerUid: owner.uid,
    gameId: 10,
    teamId: 21,
    teamName: "Recipient",
    memberPlayerIds: [2],
});
await setDoc(doc(owner.db, "rounds", "game-10-team-30-round-1"), {
    id: 40,
    ownerUid: owner.uid,
    gameId: 10,
    gameTeamId: 30,
    roundNumber: 1,
    cardPoints: 100,
    handScore: 200,
    cleanBooks: 0,
    dirtyBooks: 0,
    redThrees: 0,
    pulledCorrect: 0,
    isWinner: true,
});

const participantGameAccess = await getDocs(query(
    collection(recipient.db, "gameAccess"),
    where("participantUid", "==", recipient.uid),
));
const ownedGames = await getDocs(query(
    collection(owner.db, "games"),
    where("ownerUid", "==", owner.uid),
));
const participantGame = await getDoc(doc(recipient.db, "games", "game-10"));
const participantGameTeams = await getDocs(query(
    collection(recipient.db, "gameTeams"),
    where("gameId", "==", 10),
));
const participantRounds = await getDocs(query(
    collection(recipient.db, "rounds"),
    where("gameId", "==", 10),
));
const participantTeamRounds = await getDocs(query(
    collection(recipient.db, "rounds"),
    where("gameId", "==", 10),
    where("gameTeamId", "==", 30),
));

assert.equal(ownedGames.size, 1, "The creator should still be able to list owned games.");
assert.equal(participantGameAccess.size, 1, "A selected player should be able to list shared-game access.");
assert.equal(participantGame.exists(), true, "A selected player should be able to read the shared game.");
assert.equal(participantGameTeams.size, 2, "A selected player should be able to read every team in the shared game.");
assert.equal(participantRounds.size, 1, "A selected player should be able to read rounds in the shared game.");
assert.equal(participantTeamRounds.size, 1, "A selected player should be able to read rounds for one game team.");
await expectPermissionDenied(
    () => getDoc(doc(outsider.db, "games", "game-10")),
    "Players who were not selected for a game must not be able to read it.",
);

await Promise.all([deleteApp(owner.app), deleteApp(recipient.app), deleteApp(outsider.app)]);

console.log("Firebase friends and shared-game rules smoke test passed.");
