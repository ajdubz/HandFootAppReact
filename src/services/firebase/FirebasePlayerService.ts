import {
    User,
    createUserWithEmailAndPassword,
    signInAnonymously,
    signInWithEmailAndPassword,
} from "firebase/auth";
import {
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import PlayerAccountDTO from "../../models/DTOs/Player/PlayerAccountDTO";
import PlayerFullDetailsDTO from "../../models/DTOs/Player/PlayerFullDetailsDTO";
import PlayerGetBasicDTO from "../../models/DTOs/Player/PlayerGetBasicDTO";
import PlayerLoginDTO from "../../models/DTOs/Player/PlayerLoginDTO";
import { ApiError } from "../apiClient";
import { toPlayerAccountDTO, toPlayerBasicDTO } from "./firebaseMappers";
import {
    getAllOwnedDocs,
    getCollection,
    getFirebaseUser,
    getFirstByNumericId,
    getOwnedByNumericId,
    getRequiredFirebase,
    nextNumericId,
} from "./firebaseRepository";
import { FirebasePlayerDocument } from "./firebaseTypes";
import { firebaseAuth } from "../../firebase";

const normalizeText = (value?: string): string => (value ?? "").trim().toLowerCase();

const toLoginDTO = async (user: User, player: FirebasePlayerDocument): Promise<PlayerLoginDTO> => Object.assign(new PlayerLoginDTO(), {
    id: player.id,
    nickName: player.nickName ?? "",
    email: player.email ?? user.email ?? "",
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
    }

    public static async deletePlayer(playerId: number): Promise<void> {
        const user = await getFirebaseUser();
        const existingPlayer = await getOwnedByNumericId<FirebasePlayerDocument>("players", playerId, user.uid);
        if (!existingPlayer) {
            return;
        }

        const { db } = getRequiredFirebase();
        await deleteDoc(doc(db, "players", existingPlayer.docId));
    }

    public static async searchPlayers(search: string): Promise<PlayerGetBasicDTO[]> {
        const snapshot = await getDocs(getCollection<FirebasePlayerDocument>("players"));
        const players = snapshot.docs.map((player) => player.data());
        const normalizedSearch = normalizeText(search);
        return players.filter((player) =>
            normalizeText(player.nickName).includes(normalizedSearch) ||
            normalizeText(player.fullName).includes(normalizedSearch)
        ).map(toPlayerBasicDTO);
    }

    public static async getPlayerDocumentById(id: number): Promise<FirebasePlayerDocument | undefined> {
        const user = await getFirebaseUser();
        return (await getOwnedByNumericId<FirebasePlayerDocument>("players", id, user.uid))?.data;
    }

    public static async getReadablePlayerDocumentById(id: number): Promise<FirebasePlayerDocument | undefined> {
        return (await getFirstByNumericId<FirebasePlayerDocument>("players", id))?.data;
    }

    private static async getOwnedPlayerDocuments(): Promise<FirebasePlayerDocument[]> {
        const user = await getFirebaseUser();
        return getAllOwnedDocs<FirebasePlayerDocument>("players", user.uid);
    }

    private static async getOrCreateAuthPlayer(user: User, fallback: Partial<FirebasePlayerDocument>): Promise<FirebasePlayerDocument> {
        const existingProfile = await this.getPlayerByUid(user.uid);
        if (existingProfile) {
            return existingProfile;
        }

        return this.createPlayerDocument(user.uid, {
            uid: user.uid,
            ownerUid: user.uid,
            nickName: fallback.nickName,
            fullName: fallback.fullName,
            email: fallback.email ?? user.email ?? "",
            isGuest: fallback.isGuest ?? false,
        });
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

    private static async assertNoDuplicateOwnedPlayer(player: PlayerAccountDTO, ignoredPlayerId?: number): Promise<void> {
        const user = firebaseAuth?.currentUser;
        if (!user) {
            return;
        }

        const normalizedNickName = normalizeText(player.nickName);
        const normalizedEmail = normalizeText(player.email);
        const players = await getAllOwnedDocs<FirebasePlayerDocument>("players", user.uid);
        const duplicate = players.find((existingPlayer) =>
            existingPlayer.id !== ignoredPlayerId &&
            (
                (!!normalizedNickName && normalizeText(existingPlayer.nickName) === normalizedNickName) ||
                (!!normalizedEmail && normalizeText(existingPlayer.email) === normalizedEmail)
            )
        );

        if (duplicate) {
            throw new ApiError("An account with that nickname or email already exists.", 409, "duplicate_player");
        }
    }
}

export default FirebasePlayerService;
