import PlayerAccountDTO from "../../models/DTOs/Player/PlayerAccountDTO";
import FirebasePlayerService from "./FirebasePlayerService";
import { getAllOwnedDocs, getFirebaseUser, getRequiredFirebase, nextNumericId } from "./firebaseRepository";
import { doc, setDoc } from "firebase/firestore";

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
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    where: jest.fn(),
}));

jest.mock("./firebaseRepository", () => ({
    getAllOwnedDocs: jest.fn(),
    getCollection: jest.fn(),
    getFirebaseUser: jest.fn(),
    getFirstByNumericId: jest.fn(),
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

    test("searches owned player documents", async () => {
        (getAllOwnedDocs as jest.Mock).mockResolvedValue([
            { id: 1, ownerUid: "owner-uid", nickName: "Alex", fullName: "Alex Davis" },
            { id: 9, ownerUid: "owner-uid", nickName: "Logan", fullName: "Logan Smith" },
        ]);

        const results = await FirebasePlayerService.searchPlayers("logan");

        expect(results).toEqual([
            expect.objectContaining({ id: 9, nickName: "Logan", fullName: "Logan Smith" }),
        ]);
        expect(getAllOwnedDocs).toHaveBeenCalledWith("players", "owner-uid");
    });
});
