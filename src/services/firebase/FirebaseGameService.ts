import { doc, getDocs, query, setDoc, where } from "firebase/firestore";
import GameAddDTO from "../../models/DTOs/Game/GameAddDTO";
import GameRoundDTO from "../../models/DTOs/Game/GameRoundDTO";
import GameTeamDTO from "../../models/DTOs/Game/GameTeamDTO";
import GameWithRulesDTO from "../../models/DTOs/Game/GameWithRulesDTO";
import { normalizeRules } from "../../rules/rulesDefaults";
import { toGameRoundDTO, toGameTeamDTO, toGameWithRulesDTO } from "./firebaseMappers";
import { getCollection, getFirebaseUser, getOwnedByNumericId, getRequiredFirebase, nextNumericId } from "./firebaseRepository";
import { FirebaseGameDocument, FirebaseGameRoundDocument, FirebaseGameTeamDocument } from "./firebaseTypes";
import FirebaseTeamService from "./FirebaseTeamService";

class FirebaseGameService {
    public static async getGames(): Promise<GameWithRulesDTO[]> {
        const user = await getFirebaseUser();
        const snapshot = await getDocs(query(getCollection<FirebaseGameDocument>("games"), where("ownerUid", "==", user.uid)));
        return snapshot.docs.map((gameDoc) => toGameWithRulesDTO(gameDoc.data()));
    }

    public static async getGameById(id: number): Promise<GameWithRulesDTO | undefined> {
        const user = await getFirebaseUser();
        const game = await this.getGameDocumentById(id, user.uid);
        return game ? toGameWithRulesDTO(game) : undefined;
    }

    public static async addGame(game: GameAddDTO): Promise<GameWithRulesDTO> {
        const user = await getFirebaseUser();
        const gameId = game.id || await nextNumericId("games");
        const gameDocument: FirebaseGameDocument = {
            id: gameId,
            ownerUid: user.uid,
            date: (game.date ?? new Date()).toISOString(),
            rules: normalizeRules(game.rules),
            teamIds: [],
            memberPlayerIds: [],
        };

        const { db } = getRequiredFirebase();
        await setDoc(doc(db, "games", `game-${gameId}`), gameDocument);
        return toGameWithRulesDTO(gameDocument);
    }

    public static async addTeamToGame(gameId: number, teamId: number): Promise<void> {
        const user = await getFirebaseUser();
        const game = await this.getGameDocumentById(gameId, user.uid);
        const team = await FirebaseTeamService.getTeamDocumentById(teamId, user.uid);
        if (!game || !team) {
            throw new Error("Unable to add missing team to game.");
        }

        const existingGameTeam = await this.getGameTeamByGameAndTeam(gameId, teamId);
        if (existingGameTeam) {
            return;
        }

        const gameTeamId = await nextNumericId("gameTeams");
        const gameTeamDocument: FirebaseGameTeamDocument = {
            id: gameTeamId,
            ownerUid: user.uid,
            gameId,
            teamId,
            memberPlayerIds: team.memberPlayerIds,
        };

        const { db } = getRequiredFirebase();
        await setDoc(doc(db, "gameTeams", `gameTeam-${gameTeamId}`), gameTeamDocument);
        await setDoc(doc(db, "games", `game-${gameId}`), {
            ...game,
            teamIds: Array.from(new Set([...(game.teamIds ?? []), teamId])),
            memberPlayerIds: Array.from(new Set([...(game.memberPlayerIds ?? []), ...team.memberPlayerIds])),
        }, { merge: true });
    }

    public static async getTeamsByGameId(gameId: number): Promise<GameTeamDTO[]> {
        const user = await getFirebaseUser();
        const snapshot = await getDocs(query(
            getCollection<FirebaseGameTeamDocument>("gameTeams"),
            where("ownerUid", "==", user.uid),
            where("gameId", "==", gameId),
        ));
        return Promise.all(snapshot.docs.map((gameTeamDoc) => this.toGameTeamDTO(gameTeamDoc.data())));
    }

    public static async getRoundsByGameId(gameId: number): Promise<GameRoundDTO[]> {
        const user = await getFirebaseUser();
        const snapshot = await getDocs(query(
            getCollection<FirebaseGameRoundDocument>("rounds"),
            where("ownerUid", "==", user.uid),
            where("gameId", "==", gameId),
        ));
        const rounds = await Promise.all(snapshot.docs.map((roundDoc) => this.toRoundDTO(roundDoc.data())));
        return rounds.sort((a, b) =>
            (a.roundNumber ?? 0) - (b.roundNumber ?? 0) ||
            (a.gameTeam?.id ?? 0) - (b.gameTeam?.id ?? 0)
        );
    }

    public static async getRoundsByGameTeamId(gameTeamId: number): Promise<GameRoundDTO[]> {
        const user = await getFirebaseUser();
        const snapshot = await getDocs(query(
            getCollection<FirebaseGameRoundDocument>("rounds"),
            where("ownerUid", "==", user.uid),
            where("gameTeamId", "==", gameTeamId),
        ));
        const rounds = await Promise.all(snapshot.docs.map((roundDoc) => this.toRoundDTO(roundDoc.data())));
        return rounds.sort((a, b) => (a.roundNumber ?? 0) - (b.roundNumber ?? 0));
    }

    public static async saveGameRound(gameId: number, round: GameRoundDTO): Promise<GameRoundDTO> {
        const user = await getFirebaseUser();
        const gameTeamId = round.gameTeam?.id ?? 0;
        if (!gameTeamId) {
            throw new Error("Unable to save round without a game team.");
        }

        const existingRound = await this.getRoundByGameTeamAndRound(gameId, gameTeamId, round.roundNumber ?? 0);
        const roundId = existingRound?.id ?? await nextNumericId("rounds");
        const roundDocument: FirebaseGameRoundDocument = {
            id: roundId,
            ownerUid: user.uid,
            gameId,
            gameTeamId,
            roundNumber: round.roundNumber ?? 0,
            cardPoints: round.cardPoints ?? 0,
            handScore: round.handScore ?? 0,
            cleanBooks: round.cleanBooks ?? 0,
            dirtyBooks: round.dirtyBooks ?? 0,
            redThrees: round.redThrees ?? 0,
            pulledCorrect: round.pulledCorrect ?? 0,
            isWinner: round.isWinner ?? false,
        };

        const { db } = getRequiredFirebase();
        await setDoc(doc(db, "rounds", `round-${roundId}`), roundDocument, { merge: true });
        return this.toRoundDTO(roundDocument);
    }

    public static async getGameDocumentById(id: number, ownerUid?: string): Promise<FirebaseGameDocument | undefined> {
        const userUid = ownerUid ?? (await getFirebaseUser()).uid;
        return (await getOwnedByNumericId<FirebaseGameDocument>("games", id, userUid))?.data;
    }

    private static async getGameTeamByGameAndTeam(gameId: number, teamId: number): Promise<FirebaseGameTeamDocument | undefined> {
        const user = await getFirebaseUser();
        const snapshot = await getDocs(query(
            getCollection<FirebaseGameTeamDocument>("gameTeams"),
            where("ownerUid", "==", user.uid),
            where("gameId", "==", gameId),
            where("teamId", "==", teamId),
        ));
        return snapshot.docs[0]?.data();
    }

    private static async getGameTeamById(id: number): Promise<FirebaseGameTeamDocument | undefined> {
        const user = await getFirebaseUser();
        return (await getOwnedByNumericId<FirebaseGameTeamDocument>("gameTeams", id, user.uid))?.data;
    }

    private static async getRoundByGameTeamAndRound(
        gameId: number,
        gameTeamId: number,
        roundNumber: number,
    ): Promise<FirebaseGameRoundDocument | undefined> {
        const user = await getFirebaseUser();
        const snapshot = await getDocs(query(
            getCollection<FirebaseGameRoundDocument>("rounds"),
            where("ownerUid", "==", user.uid),
            where("gameId", "==", gameId),
            where("gameTeamId", "==", gameTeamId),
            where("roundNumber", "==", roundNumber),
        ));
        return snapshot.docs[0]?.data();
    }

    private static async toGameTeamDTO(gameTeam: FirebaseGameTeamDocument): Promise<GameTeamDTO> {
        const game = await this.getGameDocumentById(gameTeam.gameId, gameTeam.ownerUid);
        const team = await FirebaseTeamService.getTeamDocumentById(gameTeam.teamId, gameTeam.ownerUid);
        if (!game || !team) {
            throw new Error("Unable to map missing Firebase game team data.");
        }

        return toGameTeamDTO(gameTeam, game, await FirebaseTeamService.toTeamWithPlayers(team));
    }

    private static async toRoundDTO(round: FirebaseGameRoundDocument): Promise<GameRoundDTO> {
        const gameTeam = await this.getGameTeamById(round.gameTeamId);
        if (!gameTeam) {
            throw new Error("Unable to map Firebase round without a game team.");
        }

        return toGameRoundDTO(round, await this.toGameTeamDTO(gameTeam));
    }
}

export default FirebaseGameService;
