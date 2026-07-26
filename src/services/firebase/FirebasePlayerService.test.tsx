import PlayerAccountDTO from "../../models/DTOs/Player/PlayerAccountDTO";
import FirebasePlayerService from "./FirebasePlayerService";
import { getAllOwnedDocs, getFirebaseUser, getOwnedByNumericId, getRequiredFirebase, nextNumericId } from "./firebaseRepository";
import { deleteDoc, doc, getDoc, getDocs, limit, orderBy, setDoc } from "firebase/firestore";

jest.mock("../../firebase", () => ({
    firebaseAuth: null,
}));

jest.mock("firebase/auth", () => ({
    createUserWithEmailAndPassword: jest.fn(),
    signInAnonymously: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
    deleteDoc: jest.fn(),
    doc: jest.fn((_db, collectionName: string, documentId: string) => ({ collectionName, documentId })),
    endAt: jest.fn((value: string) => ({ endAt: value })),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    limit: jest.fn((value: number) => ({ limit: value })),
    orderBy: jest.fn((field: string) => ({ orderBy: field })),
    query: jest.fn((collectionRef: unknown, ...conditions: unknown[]) => ({ collectionRef, conditions })),
    setDoc: jest.fn(),
    startAt: jest.fn((value: string) => ({ startAt: value })),
    updateDoc: jest.fn(),
    where: jest.fn(),
}));

jest.mock("./firebaseRepository", () => ({
    getAllOwnedDocs: jest.fn(),
    getCollection: jest.fn((collectionName: string) => ({ collectionName })),
    getFirebaseUser: jest.fn(),
    getOwnedByNumericId: jest.fn(),
    getRequiredFirebase: jest.fn(),
    nextNumericId: jest.fn(),
}));

describe("FirebasePlayerService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getFirebaseUser as jest.Mock).mockResolvedValue({ uid: "owner-uid" });
        (getRequiredFirebase as jest.Mock).mockReturnValue({ db: {} });
        (nextNumericId as jest.Mock).mockResolvedValue(123);
        (doc as jest.Mock).mockImplementation((_db, collectionName: string, documentId: string) => ({ collectionName, documentId }));
        (getDoc as jest.Mock).mockResolvedValue({ data: () => undefined });
    });

    test("only creates the player document for guest players", async () => {
        const guest = new PlayerAccountDTO();
        guest.nickName = "Test Guest";
        guest.fullName = "Test Guest";
        guest.email = "test-guest@guest.local";

        await FirebasePlayerService.createGuest(guest);

        expect(doc).toHaveBeenCalledTimes(1);
        expect(doc).toHaveBeenCalledWith({}, "players", "guest-123");
        expect(setDoc).toHaveBeenCalledTimes(1);
        expect(setDoc).toHaveBeenCalledWith(
            { collectionName: "players", documentId: "guest-123" },
            expect.objectContaining({
                id: 123,
                ownerUid: "owner-uid",
                isGuest: true,
                nickName: "Test Guest",
            }),
        );
    });

    test("uses nickname search unless a leading hash explicitly selects tag search", async () => {
        (getDocs as jest.Mock).mockResolvedValue({
            docs: [
                {
                    data: () => ({
                        id: 9,
                        ownerUid: "other-uid",
                        nickName: "Logan",
                        nickNameNormalized: "logan",
                        publicTag: "A7K3XYZ",
                        publicTagNormalized: "a7k3xyz",
                    }),
                },
            ],
        });

        await expect(FirebasePlayerService.searchPlayers("LoG")).resolves.toEqual([
            expect.objectContaining({
                id: 9,
                nickName: "Logan",
                publicTag: "A7K3XYZ",
                fullName: "",
                email: "",
            }),
        ]);
        expect(orderBy).toHaveBeenLastCalledWith("nickNameNormalized");

        await expect(FirebasePlayerService.searchPlayers("a7K")).resolves.toEqual([]);
        expect(orderBy).toHaveBeenLastCalledWith("nickNameNormalized");

        await expect(FirebasePlayerService.searchPlayers("#a7K")).resolves.toEqual([
            expect.objectContaining({ id: 9, publicTag: "A7K3XYZ" }),
        ]);
        expect(orderBy).toHaveBeenLastCalledWith("publicTagNormalized");

        expect(limit).toHaveBeenCalledWith(20);
        expect(getAllOwnedDocs).not.toHaveBeenCalled();
    });

    test("backfills a real player's public directory entry when their profile loads", async () => {
        (getOwnedByNumericId as jest.Mock).mockResolvedValue({
            docId: "owner-uid",
            data: {
                id: 9,
                uid: "owner-uid",
                ownerUid: "owner-uid",
                nickName: "Logan",
                fullName: "Logan Smith",
                email: "logan@example.com",
                isGuest: false,
            },
        });

        await FirebasePlayerService.getPlayerDocumentById(9);

        expect(setDoc).toHaveBeenCalledWith(
            { collectionName: "playerDirectory", documentId: "owner-uid" },
            expect.objectContaining({
                id: 9,
                ownerUid: "owner-uid",
                nickName: "Logan",
                nickNameNormalized: "logan",
                publicTag: expect.stringMatching(/^[A-Z0-9]{7}$/),
            }),
        );
    });

    test("deletes a player cleanly when no public directory entry exists", async () => {
        (getOwnedByNumericId as jest.Mock).mockResolvedValue({
            docId: "guest-123",
            data: {
                id: 123,
                ownerUid: "owner-uid",
                nickName: "Guest Player",
                isGuest: true,
            },
        });

        await FirebasePlayerService.deletePlayer(123);

        expect(deleteDoc).toHaveBeenCalledTimes(1);
        expect(deleteDoc).toHaveBeenCalledWith({ collectionName: "players", documentId: "guest-123" });
    });
});
