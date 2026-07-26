import GameTeamDTO from "../../models/DTOs/Game/GameTeamDTO";
import TeamGetWithPlayerNamesDTO from "../../models/DTOs/Team/TeamGetWithPlayerNamesDTO";
import Rules from "../../models/Rules";
import { toFirestoreRules, toGameRoundDTO, toGameTeamDTO, toPlayerAccountDTO, toPlayerDirectoryBasicDTO, toTeamWithPlayersDTO } from "./firebaseMappers";
import { FirebaseGameDocument, FirebaseGameRoundDocument, FirebaseGameTeamDocument, FirebasePlayerDirectoryDocument, FirebasePlayerDocument, FirebaseTeamDocument } from "./firebaseTypes";

describe("Firebase DTO mappers", () => {
    test("keeps numeric player IDs while hiding Firebase document details", () => {
        const player: FirebasePlayerDocument = {
            id: 17,
            uid: "firebase-uid",
            ownerUid: "firebase-uid",
            nickName: "Logan",
            fullName: "Logan Howlett",
            email: "logan@example.com",
        };

        expect(toPlayerAccountDTO(player)).toMatchObject({
            id: 17,
            nickName: "Logan",
            fullName: "Logan Howlett",
            email: "logan@example.com",
            password: "",
            publicTag: expect.stringMatching(/^[A-Z0-9]{7}$/),
        });
    });

    test("maps public directory players without private profile fields", () => {
        const directoryPlayer: FirebasePlayerDirectoryDocument = {
            id: 17,
            ownerUid: "firebase-uid",
            nickName: "Logan",
            nickNameNormalized: "logan",
            publicTag: "A7K3XYZ",
            publicTagNormalized: "a7k3xyz",
        };

        expect(toPlayerDirectoryBasicDTO(directoryPlayer)).toMatchObject({
            id: 17,
            nickName: "Logan",
            publicTag: "A7K3XYZ",
            fullName: "",
            email: "",
            isGuest: false,
        });
    });

    test("maps teams, game teams, and rounds with existing scorekeeping fields", () => {
        const team: FirebaseTeamDocument = {
            id: 3,
            ownerUid: "uid-1",
            name: "Alex and Sam",
            memberPlayerIds: [1, 2],
        };
        const teamDto: TeamGetWithPlayerNamesDTO = toTeamWithPlayersDTO(team, []);
        const game: FirebaseGameDocument = {
            id: 9,
            ownerUid: "uid-1",
            date: "2026-07-04T12:00:00.000Z",
            teamIds: [3],
            memberPlayerIds: [1, 2],
        };
        const gameTeam: FirebaseGameTeamDocument = {
            id: 11,
            ownerUid: "uid-1",
            gameId: 9,
            teamId: 3,
            memberPlayerIds: [1, 2],
        };
        const gameTeamDto: GameTeamDTO = toGameTeamDTO(gameTeam, game, teamDto);
        const round: FirebaseGameRoundDocument = {
            id: 21,
            ownerUid: "uid-1",
            gameId: 9,
            gameTeamId: 11,
            roundNumber: 2,
            cleanBooks: 1,
            dirtyBooks: 2,
            cardPoints: 345,
            handScore: 1445,
            redThrees: 0,
            pulledCorrect: 1,
            isWinner: true,
        };

        expect(gameTeamDto).toMatchObject({
            id: 11,
            game: { id: 9 },
            team: { id: 3, name: "Alex and Sam" },
        });
        expect(toGameRoundDTO(round, gameTeamDto)).toMatchObject({
            id: 21,
            gameTeam: { id: 11 },
            roundNumber: 2,
            cleanBooks: 1,
            dirtyBooks: 2,
            handScore: 1445,
            isWinner: true,
        });
    });

    test("maps rules to a plain object that Firestore can serialize", () => {
        const rules = new Rules();
        rules.cleanBookScore = 600;

        const firestoreRules = toFirestoreRules(rules);

        expect(firestoreRules).toMatchObject({
            cleanBookScore: 600,
            dirtyBookScore: 0,
            cleanBooksRequiredToGoOut: 0,
        });
        expect(firestoreRules).not.toBeInstanceOf(Rules);
        expect(Object.getPrototypeOf(firestoreRules)).toBe(Object.prototype);
    });
});
