import PlayerFriendBasicDTO from "../../models/DTOs/Player/PlayerFriendBasicDTO";
import { deleteDoc, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { getAllOwnedDocs, getFirebaseUser, getRequiredFirebase, nextNumericId } from "./firebaseRepository";
import FirebaseFriendService from "./FirebaseFriendService";
import FirebasePlayerService from "./FirebasePlayerService";

jest.mock("firebase/firestore", () => ({
    deleteDoc: jest.fn(),
    doc: jest.fn((_db, collectionName: string, documentId: string) => ({ collectionName, documentId })),
    getDocs: jest.fn(),
    query: jest.fn((collectionRef: unknown, ...conditions: unknown[]) => ({ collectionRef, conditions })),
    setDoc: jest.fn(),
    where: jest.fn((field: string, operator: string, value: unknown) => ({ field, operator, value })),
}));

jest.mock("./firebaseRepository", () => ({
    getAllOwnedDocs: jest.fn(),
    getCollection: jest.fn((collectionName: string) => ({ collectionName })),
    getFirebaseUser: jest.fn(),
    getRequiredFirebase: jest.fn(),
    nextNumericId: jest.fn(),
}));

jest.mock("./FirebasePlayerService", () => ({
    __esModule: true,
    default: {
        getPlayerDocumentById: jest.fn(),
        getReadablePlayerDocumentById: jest.fn(),
        searchPlayers: jest.fn(),
    },
}));

describe("FirebaseFriendService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getFirebaseUser as jest.Mock).mockResolvedValue({ uid: "owner-uid" });
        (getRequiredFirebase as jest.Mock).mockReturnValue({ db: {} });
        (getAllOwnedDocs as jest.Mock).mockResolvedValue([]);
        (nextNumericId as jest.Mock).mockResolvedValue(123);
        (doc as jest.Mock).mockImplementation((_db, collectionName: string, documentId: string) => ({ collectionName, documentId }));
        (getDocs as jest.Mock).mockResolvedValue({ docs: [] });
        (FirebasePlayerService.getReadablePlayerDocumentById as jest.Mock).mockResolvedValue(undefined);
    });

    test("sends friend requests to documents visible to the recipient", async () => {
        (FirebasePlayerService.getReadablePlayerDocumentById as jest.Mock).mockResolvedValue({
            id: 4,
            uid: "recipient-uid",
            ownerUid: "recipient-uid",
            nickName: "Casey",
            fullName: "Casey Morgan",
        });
        const playerFriend = new PlayerFriendBasicDTO();
        playerFriend.playerId = 1;
        playerFriend.friendId = 4;

        await FirebaseFriendService.sendFriendRequest(1, playerFriend);

        expect(doc).toHaveBeenCalledWith({}, "friendRequests", "owner-uid_1_4");
        expect(setDoc).toHaveBeenCalledWith(
            { collectionName: "friendRequests", documentId: "owner-uid_1_4" },
            expect.objectContaining({
                id: 123,
                ownerUid: "owner-uid",
                playerId: 1,
                friendId: 4,
                recipientUid: "recipient-uid",
                participantUids: ["owner-uid", "recipient-uid"],
            }),
            { merge: true },
        );
    });

    test("loads incoming friend requests by recipient uid", async () => {
        (getDocs as jest.Mock).mockResolvedValue({
            docs: [
                { data: () => ({ id: 123, ownerUid: "requester-uid", recipientUid: "owner-uid", playerId: 4, friendId: 1 }) },
                { data: () => ({ id: 124, ownerUid: "other-uid", recipientUid: "owner-uid", playerId: 5, friendId: 9 }) },
            ],
        });
        (FirebasePlayerService.getReadablePlayerDocumentById as jest.Mock).mockResolvedValue({
            id: 4,
            uid: "requester-uid",
            ownerUid: "requester-uid",
            nickName: "Casey",
            fullName: "Casey Morgan",
        });

        const requests = await FirebaseFriendService.getFriendRequests(1);

        expect(where).toHaveBeenCalledWith("recipientUid", "==", "owner-uid");
        expect(requests).toEqual([
            expect.objectContaining({ id: 4, nickName: "Casey" }),
        ]);
    });

    test("declines incoming friend requests by deleting the sender-owned request document", async () => {
        (FirebasePlayerService.getReadablePlayerDocumentById as jest.Mock).mockResolvedValue({
            id: 4,
            uid: "requester-uid",
            ownerUid: "requester-uid",
        });
        const playerFriend = new PlayerFriendBasicDTO();
        playerFriend.playerId = 1;
        playerFriend.friendId = 4;

        await FirebaseFriendService.declineFriendRequest(1, playerFriend);

        expect(query).toHaveBeenCalled();
        expect(doc).toHaveBeenCalledWith({}, "friendRequests", "requester-uid_4_1");
        expect(deleteDoc).toHaveBeenCalledWith({ collectionName: "friendRequests", documentId: "requester-uid_4_1" });
    });
});
