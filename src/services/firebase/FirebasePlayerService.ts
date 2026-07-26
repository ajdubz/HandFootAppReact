import {
    User,
    createUserWithEmailAndPassword,
    signInAnonymously,
    signInWithEmailAndPassword,
} from "firebase/auth";
import {
    deleteDoc,
    doc,
    endAt,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    setDoc,
    startAt,
    updateDoc,
    where,
} from "firebase/firestore";
import PlayerAccountDTO from "../../models/DTOs/Player/PlayerAccountDTO";
import PlayerFullDetailsDTO from "../../models/DTOs/Player/PlayerFullDetailsDTO";
import PlayerGetBasicDTO from "../../models/DTOs/Player/PlayerGetBasicDTO";
import PlayerLoginDTO from "../../models/DTOs/Player/PlayerLoginDTO";
import { ApiError } from "../apiClient";
import { toPlayerAccountDTO, toPlayerBasicDTO, toPlayerDirectoryBasicDTO } from "./firebaseMappers";
import {
    getAllOwnedDocs,
    getCollection,
    getFirebaseUser,
    getOwnedByNumericId,
    getRequiredFirebase,
    nextNumericId,
} from "./firebaseRepository";
import { FirebasePlayerDirectoryDocument, FirebasePlayerDocument } from "./firebaseTypes";
import { firebaseAuth } from "../../firebase";
import {
    getPlayerPublicTag,
    matchesPlayerPublicSearch,
    normalizePlayerSearchText,
} from "../../player/playerPublicId";

const normalizeText = (value?: string): string => (value ?? "").trim().toLowerCase();
const DIRECTORY_SEARCH_LIMIT = 20;
const DIRECTORY_SEARCH_END = "\uf8ff";

const toLoginDTO = async (user: User, player: FirebasePlayerDocument): Promise<PlayerLoginDTO> => Object.assign(new PlayerLoginDTO(), {
    id: player.id,
    nickName: player.nickName ?? "",
    email: user.email ?? player.email ?? "",
    token: await user.getIdToken(),
});

class FirebasePlayerService {
    public static async LoginPlayer(playerAccountDTO: PlayerAccountDTO): Promise<PlayerLoginDTO | undefined> {
        if (!firebaseAuth) {
            throw new Error("Firebase Auth is not configured.");
        }

        const email = playerAccountDTO.email?.trim() ?? "";
        const password = playerAccountDTO.password ?? "";
        const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const profile = await this.getOrCreateAuthPlayer(credential.user, {
            nickName: credential.user.displayName || credential.user.email || "Player",
            email: credential.user.email ?? email,
        });

        return toLoginDTO(credential.user, profile);
    }

    public static async startGuestSession(): Promise<PlayerLoginDTO> {
        if (!firebaseAuth) {
            throw new Error("Firebase Auth is not configured.");
        }

        const credential = await signInAnonymously(firebaseAuth);
        const profile = await this.getOrCreateAuthPlayer(credential.user, {
            nickName: "Guest Player",
            fullName: "Guest Player",
            email: `guest-${credential.user.uid}@firebase.local`,
            isGuest: true,
        });

        return toLoginDTO(credential.user, profile);
    }

    public static async getPlayers(): Promise<PlayerGetBasicDTO[]> {
        const user = await getFirebaseUser();
        const players = await getAllOwnedDocs<FirebasePlayerDocument>("players", user.uid);
        return players.map(toPlayerBasicDTO);
    }

    public static async getPlayerAccountById(id: number): Promise<PlayerAccountDTO | undefined> {
        const player = await this.getPlayerDocumentById(id);
        return player ? toPlayerAccountDTO(player) : undefined;
    }

    public static async getPlayerFullDetailsById(id: number): Promise<PlayerFullDetailsDTO> {
        const account = await this.getPlayerAccountById(id);
        return Object.assign(new PlayerFullDetailsDTO(), {
            nickName: account?.nickName ?? "",
            fullName: account?.fullName ?? "",
            publicTag: getPlayerPublicTag(id, account?.publicTag),
            gameTeams: [],
            friends: [],
        });
    }

    public static async createPlayer(player: PlayerAccountDTO): Promise<PlayerAccountDTO> {
        if (!firebaseAuth) {
            throw new Error("Firebase Auth is not configured.");
        }

        await this.assertNoDuplicateOwnedPlayer(player);

        try {
            const credential = await createUserWithEmailAndPassword(firebaseAuth, player.email ?? "", player.password ?? "");
            const createdPlayer = await this.createPlayerDocument(credential.user.uid, {
                uid: credential.user.uid,
                ownerUid: credential.user.uid,
                nickName: player.nickName,
                fullName: player.fullName,
                email: credential.user.email ?? player.email,
                isGuest: false,
            });
            await this.ensurePlayerDirectory(credential.user.uid, createdPlayer);

            return toPlayerAccountDTO(createdPlayer);
        } catch (error) {
            if (error instanceof Error && "code" in error && String(error.code).includes("email-already-in-use")) {
                throw new ApiError("An account with that email already exists.", 409, "duplicate_player");
            }

            throw error;
        }
    }

    public static async createGuest(player: PlayerAccountDTO): Promise<PlayerAccountDTO> {
        const user = await getFirebaseUser();
        const nextId = await nextNumericId("players");
        const guestPlayer = await this.createPlayerDocument(`guest-${nextId}`, {
            ownerUid: user.uid,
            nickName: player.nickName || `Guest ${nextId}`,
            fullName: player.fullName || player.nickName || `Guest ${nextId}`,
            email: player.email || `guest-${nextId}@firebase.local`,
            isGuest: true,
        }, nextId);

        return toPlayerAccountDTO(guestPlayer);
    }

    public static async updatePlayerAccount(playerId: number, player: PlayerAccountDTO): Promise<void> {
        const user = await getFirebaseUser();
        const existingPlayer = await getOwnedByNumericId<FirebasePlayerDocument>("players", playerId, user.uid);
        if (!existingPlayer) {
            return;
        }

        await this.assertNoDuplicateOwnedPlayer(player, playerId);
        const { db } = getRequiredFirebase();
        await updateDoc(doc(db, "players", existingPlayer.docId), {
            nickName: player.nickName ?? "",
            fullName: player.fullName ?? "",
            email: player.email ?? "",
        });
        await this.ensurePlayerDirectory(user.uid, {
            ...existingPlayer.data,
            nickName: player.nickName ?? "",
            fullName: player.fullName ?? "",
            email: player.email ?? "",
        });
    }

    public static async deletePlayer(playerId: number): Promise<void> {
        const user = await getFirebaseUser();
        const existingPlayer = await getOwnedByNumericId<FirebasePlayerDocument>("players", playerId, user.uid);
        if (!existingPlayer) {
            return;
        }

        const { db } = getRequiredFirebase();
        const directoryRef = doc(db, "playerDirectory", user.uid);
        const directory = (await getDoc(directoryRef)).data() as FirebasePlayerDirectoryDocument | undefined;
        const deletions = [deleteDoc(doc(db, "players", existingPlayer.docId))];
        if (directory?.ownerUid === user.uid) {
            deletions.push(deleteDoc(directoryRef));
        }

        await Promise.all(deletions);
    }

    public static async searchPlayers(search: string): Promise<PlayerGetBasicDTO[]> {
        const normalizedSearch = normalizePlayerSearchText(search);
        if (!normalizedSearch) {
            return [];
        }

        const isTagSearch = normalizedSearch.startsWith("#");
        const queryText = isTagSearch ? normalizedSearch.slice(1) : normalizedSearch;
        if (!queryText) {
            return [];
        }

        const directory = getCollection<FirebasePlayerDirectoryDocument>("playerDirectory");
        const searchField = isTagSearch ? "publicTagNormalized" : "nickNameNormalized";
        const snapshot = await getDocs(query(
            directory,
            orderBy(searchField),
            startAt(queryText),
            endAt(`${queryText}${DIRECTORY_SEARCH_END}`),
            limit(DIRECTORY_SEARCH_LIMIT),
        ));
        const playersById = new Map<number, PlayerGetBasicDTO>();
        snapshot.docs.forEach((playerSnapshot) => {
            const player = toPlayerDirectoryBasicDTO(playerSnapshot.data());
            if (matchesPlayerPublicSearch(player, normalizedSearch)) {
                playersById.set(player.id ?? 0, player);
            }
        });

        return Array.from(playersById.values()).slice(0, DIRECTORY_SEARCH_LIMIT);
    }

    public static async getPlayerDocumentById(id: number): Promise<FirebasePlayerDocument | undefined> {
        const user = await getFirebaseUser();
        const player = (await getOwnedByNumericId<FirebasePlayerDocument>("players", id, user.uid))?.data;
        if (player) {
            await this.ensurePlayerDirectory(user.uid, player);
        }
        return player;
    }

    public static async getPublicPlayerById(id: number): Promise<FirebasePlayerDirectoryDocument | undefined> {
        const snapshot = await getDocs(query(
            getCollection<FirebasePlayerDirectoryDocument>("playerDirectory"),
            where("id", "==", id),
            limit(1),
        ));
        return snapshot.docs[0]?.data();
    }

    private static async getOwnedPlayerDocuments(): Promise<FirebasePlayerDocument[]> {
        const user = await getFirebaseUser();
        return getAllOwnedDocs<FirebasePlayerDocument>("players", user.uid);
    }

    private static async getOrCreateAuthPlayer(user: User, fallback: Partial<FirebasePlayerDocument>): Promise<FirebasePlayerDocument> {
        const existingProfile = await this.getPlayerByUid(user.uid);
        if (existingProfile) {
            await this.ensurePlayerDirectory(user.uid, existingProfile);
            return existingProfile;
        }

        const createdProfile = await this.createPlayerDocument(user.uid, {
            uid: user.uid,
            ownerUid: user.uid,
            nickName: fallback.nickName,
            fullName: fallback.fullName,
            email: fallback.email ?? user.email ?? "",
            isGuest: fallback.isGuest ?? false,
        });
        await this.ensurePlayerDirectory(user.uid, createdProfile);
        return createdProfile;
    }

    private static async getPlayerByUid(uid: string): Promise<FirebasePlayerDocument | undefined> {
        const { db } = getRequiredFirebase();
        const snapshot = await getDoc(doc(db, "players", uid));
        const player = snapshot.data() as FirebasePlayerDocument | undefined;
        return player?.ownerUid === uid ? player : undefined;
    }

    private static async createPlayerDocument(
        docId: string,
        player: Omit<FirebasePlayerDocument, "id">,
        providedId?: number,
    ): Promise<FirebasePlayerDocument> {
        const { db } = getRequiredFirebase();
        const numericId = providedId ?? await nextNumericId("players");
        const playerDocument: FirebasePlayerDocument = {
            ...player,
            id: numericId,
            ownerUid: player.ownerUid || player.uid || docId,
        };

        await setDoc(doc(db, "players", docId), playerDocument);
        return playerDocument;
    }

    private static async ensurePlayerDirectory(userUid: string, player: FirebasePlayerDocument): Promise<void> {
        if (player.isGuest === true) {
            return;
        }

        const { db } = getRequiredFirebase();
        const directoryRef = doc(db, "playerDirectory", userUid);
        const publicTag = getPlayerPublicTag(player.id);
        const directoryDocument: FirebasePlayerDirectoryDocument = {
            id: player.id,
            ownerUid: userUid,
            nickName: player.nickName ?? "Player",
            nickNameNormalized: normalizePlayerSearchText(player.nickName ?? "Player"),
            publicTag,
            publicTagNormalized: normalizePlayerSearchText(publicTag),
        };
        const existingDirectory = (await getDoc(directoryRef)).data() as FirebasePlayerDirectoryDocument | undefined;

        if (
            existingDirectory?.id === directoryDocument.id &&
            existingDirectory.ownerUid === directoryDocument.ownerUid &&
            existingDirectory.nickName === directoryDocument.nickName &&
            existingDirectory.nickNameNormalized === directoryDocument.nickNameNormalized &&
            existingDirectory.publicTag === directoryDocument.publicTag &&
            existingDirectory.publicTagNormalized === directoryDocument.publicTagNormalized
        ) {
            return;
        }

        await setDoc(directoryRef, directoryDocument);
    }

    private static async assertNoDuplicateOwnedPlayer(player: PlayerAccountDTO, ignoredPlayerId?: number): Promise<void> {
        const user = firebaseAuth?.currentUser;
        if (!user) {
            return;
        }

        const normalizedEmail = normalizeText(player.email);
        const players = await getAllOwnedDocs<FirebasePlayerDocument>("players", user.uid);
        const duplicate = players.find((existingPlayer) =>
            existingPlayer.id !== ignoredPlayerId &&
            !!normalizedEmail &&
            normalizeText(existingPlayer.email) === normalizedEmail
        );

        if (duplicate) {
            throw new ApiError("An account with that email already exists.", 409, "duplicate_player");
        }
    }
}

export default FirebasePlayerService;
