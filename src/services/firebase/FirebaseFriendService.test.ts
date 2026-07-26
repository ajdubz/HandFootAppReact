import PlayerFriendBasicDTO from "../../models/DTOs/Player/PlayerFriendBasicDTO";
import { deleteDoc, doc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { getAllOwnedDocs, getFirebaseUser, getRequiredFirebase, nextNumericId } from "./firebaseRepository";
import FirebaseFriendService from "./FirebaseFriendService";
import FirebasePlayerService from "./FirebasePlayerService";

jest.mock("firebase/firestore", () => ({
    deleteDoc: jest.fn(),
    doc: jest.fn((_db, collectionName: string, documentId: string) => ({ collectionName, documentId })),
    getDocs: jest.fn(),
    query: jest.fn((collectionRef: unknown, ...conditions: unknown[]) => ({ collectionRef, conditions })),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
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
        getPublicPlayerById: jest.fn(),
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
        (FirebasePlayerService.getPublicPlayerById as jest.Mock).mockResolvedValue(undefined);
    });

    test("sends friend requests to documents visible to the recipient", async () => {
        (FirebasePlayerService.getPublicPlayerById as jest.Mock).mockResolvedValue({
            id: 4,
            ownerUid: "recipient-uid",
            nickName: "Casey",
            nickNameNormalized: "casey",
            publicTag: "CAS1234",
            publicTagNormalized: "cas1234",
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

    test("lists friendships through owner and scalar participant queries", async () => {
        await FirebaseFriendService.getFriends(1);

        expect(where).toHaveBeenCalledWith("ownerUid", "==", "owner-uid");
        expect(where).toHaveBeenCalledWith("participantUid1", "==", "owner-uid");
        expect(where).toHaveBeenCalledWith("participantUid2", "==", "owner-uid");
        expect(where).not.toHaveBeenCalledWith("participantUids", "array-contains", "owner-uid");
    });

    test("backfills scalar participant fields on owned legacy friendships", async () => {
        (getDocs as jest.Mock)
            .mockResolvedValueOnce({
                docs: [{
                    id: "legacy-friendship",
                    data: () => ({
                        id: 1,
                        ownerUid: "owner-uid",
                        playerId: 1,
                        friendId: 4,
                        participantUids: ["owner-uid", "friend-uid"],
                    }),
                }],
            })
            .mockResolvedValue({ docs: [] });

        await FirebaseFriendService.getFriends(1);

        expect(updateDoc).toHaveBeenCalledWith(
            { collectionName: "friendships", documentId: "legacy-friendship" },
            {
                participantUid1: "owner-uid",
                participantUid2: "friend-uid",
            },
        );
    });

    test("loads incoming friend requests by recipient uid", async () => {
        (getDocs as jest.Mock).mockResolvedValue({
            docs: [
                { data: () => ({ id: 123, ownerUid: "requester-uid", recipientUid: "owner-uid", playerId: 4, friendId: 1 }) },
                { data: () => ({ id: 124, ownerUid: "other-uid", recipientUid: "owner-uid", playerId: 5, friendId: 9 }) },
            ],
        });
        (FirebasePlayerService.getPublicPlayerById as jest.Mock).mockResolvedValue({
            id: 4,
            ownerUid: "requester-uid",
            nickName: "Casey",
            nickNameNormalized: "casey",
            publicTag: "CAS1234",
            publicTagNormalized: "cas1234",
        });

        const requests = await FirebaseFriendService.getFriendRequests(1);

        expect(where).toHaveBeenCalledWith("recipientUid", "==", "owner-uid");
        expect(requests).toEqual([
            expect.objectContaining({ id: 4, nickName: "Casey", publicTag: "CAS1234" }),
        ]);
    });

    test("declines incoming legacy requests by deleting the actual matching document", async () => {
        (getDocs as jest.Mock).mockResolvedValue({
            docs: [{
                id: "legacy-request-document",
                data: () => ({
                    id: 99,
                    ownerUid: "requester-uid",
                    recipientUid: "owner-uid",
                    playerId: 4,
                    friendId: 1,
                }),
            }],
        });
        const playerFriend = new PlayerFriendBasicDTO();
        playerFriend.playerId = 1;
        playerFriend.friendId = 4;

        await FirebaseFriendService.declineFriendRequest(1, playerFriend);

        expect(query).toHaveBeenCalled();
        expect(FirebasePlayerService.getPublicPlayerById).not.toHaveBeenCalled();
        expect(deleteDoc).toHaveBeenCalledWith({ collectionName: "friendRequests", documentId: "legacy-request-document" });
    });
});
