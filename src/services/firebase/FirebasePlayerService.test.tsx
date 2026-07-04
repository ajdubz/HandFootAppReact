import PlayerAccountDTO from "../../models/DTOs/Player/PlayerAccountDTO";
import FirebasePlayerService from "./FirebasePlayerService";
import { getFirebaseUser, getRequiredFirebase, nextNumericId } from "./firebaseRepository";
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

    test("does not create login aliases for guest players", async () => {
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
});
