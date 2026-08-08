import { doc, getDoc, getDocs, setDoc, where, writeBatch } from "firebase/firestore";
import GameRoundDTO from "../../models/DTOs/Game/GameRoundDTO";
import GameTeamDTO from "../../models/DTOs/Game/GameTeamDTO";
import { getFirebaseUser, getRequiredFirebase, nextNumericId } from "./firebaseRepository";
import FirebaseGameService from "./FirebaseGameService";
import FirebasePlayerService from "./FirebasePlayerService";
import FirebaseTeamService from "./FirebaseTeamService";
import { FirebaseGameDocument, FirebaseGameTeamDocument } from "./firebaseTypes";

jest.mock("firebase/firestore", () => ({
    doc: jest.fn((_db, collectionName: string, documentId: string) => ({ collectionName, documentId })),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn((collectionRef: unknown, ...conditions: unknown[]) => ({ collectionRef, conditions })),
    setDoc: jest.fn(),
    where: jest.fn((field: string, operator: string, value: unknown) => ({ field, operator, value })),
    writeBatch: jest.fn(() => ({
        set: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
    })),
}));

jest.mock("./firebaseRepository", () => ({
    getCollection: jest.fn((collectionName: string) => ({ collectionName })),
    getFirebaseUser: jest.fn(),
    getRequiredFirebase: jest.fn(),
    nextNumericId: jest.fn(),
}));

jest.mock("./FirebasePlayerService", () => ({
    __esModule: true,
    default: {
        getPublicPlayerById: jest.fn(),
    },
}));

jest.mock("./FirebaseTeamService", () => ({
    __esModule: true,
    default: {
        getTeamDocumentById: jest.fn(),
        toSharedGameTeam: jest.fn(),
        toTeamWithPlayers: jest.fn(),
    },
}));

const gameDocument: FirebaseGameDocument = {
    id: 9,
    ownerUid: "owner-uid",
    date: "2026-07-26T12:00:00.000Z",
    rules: {},
    teamIds: [3, 4],
    memberPlayerIds: [1, 2],
};

const gameTeams: FirebaseGameTeamDocument[] = [
    {
        id: 11,
        ownerUid: "owner-uid",
        gameId: 9,
        teamId: 3,
        teamName: "Alex",
        memberPlayerIds: [1],
    },
    {
        id: 12,
        ownerUid: "owner-uid",
        gameId: 9,
        teamId: 4,
        teamName: "Brant",
        memberPlayerIds: [2],
    },
];

describe("FirebaseGameService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getFirebaseUser as jest.Mock).mockResolvedValue({ uid: "owner-uid" });
        (getRequiredFirebase as jest.Mock).mockReturnValue({ db: {} });
        (FirebasePlayerService.getPublicPlayerById as jest.Mock).mockImplementation(async (playerId: number) => ({
            id: playerId,
            ownerUid: playerId === 1 ? "owner-uid" : "friend-uid",
        }));
        (writeBatch as jest.Mock).mockReturnValue({
            set: jest.fn(),
            commit: jest.fn().mockResolvedValue(undefined),
        });
        (nextNumericId as jest.Mock)
            .mockResolvedValueOnce(101)
            .mockResolvedValueOnce(102);
        (doc as jest.Mock).mockImplementation((_db, collectionName: string, documentId: string) => ({
            collectionName,
            documentId,
        }));
        (getDoc as jest.Mock).mockImplementation(async (reference: { collectionName: string; documentId: string }) => {
            if (reference.collectionName === "games") {
                const gameId = Number(reference.documentId.replace("game-", ""));
                return {
                    data: () => ({
                        ...gameDocument,
                        id: gameId,
                        ownerUid: gameId === 9 ? "owner-uid" : "friend-uid",
                        participantUids: ["owner-uid", "friend-uid"],
                    }),
                };
            }

            const gameTeam = gameTeams.find((item) => `gameTeam-${item.id}` === reference.documentId);
            return { data: () => gameTeam };
        });
        (FirebaseTeamService.getTeamDocumentById as jest.Mock).mockImplementation(async (teamId: number) => ({
            id: teamId,
            ownerUid: "owner-uid",
            name: teamId === 3 ? "Alex" : "Brant",
            memberPlayerIds: [teamId === 3 ? 1 : 2],
        }));
        (FirebaseTeamService.toTeamWithPlayers as jest.Mock).mockImplementation(async (team) => ({
            id: team.id,
            name: team.name,
            teamMembers: [],
        }));
    });

    test("lists both owned games and games containing the signed-in player", async () => {
        (getDocs as jest.Mock)
            .mockResolvedValueOnce({
                docs: [{ id: "game-9", data: () => gameDocument }],
            })
            .mockResolvedValueOnce({
                docs: [
                    { id: "access-9", data: () => ({ gameId: 9, ownerUid: "owner-uid", participantUid: "owner-uid" }) },
                    { id: "access-10", data: () => ({ gameId: 10, ownerUid: "friend-uid", participantUid: "owner-uid" }) },
                ],
            });

        const games = await FirebaseGameService.getGames();

        expect(where).toHaveBeenCalledWith("ownerUid", "==", "owner-uid");
        expect(where).toHaveBeenCalledWith("participantUid", "==", "owner-uid");
        expect(setDoc).toHaveBeenCalledWith(
            { collectionName: "games", documentId: "game-9" },
            expect.objectContaining({ participantUids: ["owner-uid", "friend-uid"] }),
            { merge: true },
        );
        expect(games.map((game) => game.id)).toEqual([9, 10]);
    });

    test("commits every team's score for a round in one batch", async () => {
        (getDocs as jest.Mock)
            .mockResolvedValueOnce({
                docs: gameTeams.map((gameTeam) => ({
                    id: `gameTeam-${gameTeam.id}`,
                    data: () => gameTeam,
                })),
            })
            .mockResolvedValueOnce({ docs: [] });
        const rounds = gameTeams.map((gameTeam, index) => {
            const round = new GameRoundDTO();
            round.gameTeam = Object.assign(new GameTeamDTO(), { id: gameTeam.id });
            round.roundNumber = 1;
            round.handScore = 100 + index;
            return round;
        });

        const savedRounds = await FirebaseGameService.saveGameRounds(9, rounds);
        const batch = (writeBatch as jest.Mock).mock.results[0].value;

        expect(batch.set).toHaveBeenNthCalledWith(
            1,
            { collectionName: "rounds", documentId: "game-9-team-11-round-1" },
            expect.objectContaining({ id: 101, gameId: 9, gameTeamId: 11, roundNumber: 1 }),
            { merge: true },
        );
        expect(batch.set).toHaveBeenNthCalledWith(
            2,
            { collectionName: "rounds", documentId: "game-9-team-12-round-1" },
            expect.objectContaining({ id: 102, gameId: 9, gameTeamId: 12, roundNumber: 1 }),
            { merge: true },
        );
        expect(batch.commit).toHaveBeenCalledTimes(1);
        expect(savedRounds).toHaveLength(2);
    });
});
