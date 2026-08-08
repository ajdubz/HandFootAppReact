import { doc, getDoc, getDocs, query, setDoc, where, writeBatch } from "firebase/firestore";
import GameAddDTO from "../../models/DTOs/Game/GameAddDTO";
import GameRoundDTO from "../../models/DTOs/Game/GameRoundDTO";
import GameTeamDTO from "../../models/DTOs/Game/GameTeamDTO";
import GameWithRulesDTO from "../../models/DTOs/Game/GameWithRulesDTO";
import { toFirestoreRules, toGameRoundDTO, toGameTeamDTO, toGameWithRulesDTO } from "./firebaseMappers";
import { getCollection, getFirebaseUser, getRequiredFirebase, nextNumericId } from "./firebaseRepository";
import { FirebaseGameAccessDocument, FirebaseGameDocument, FirebaseGameRoundDocument, FirebaseGameTeamDocument } from "./firebaseTypes";
import FirebasePlayerService from "./FirebasePlayerService";
import FirebaseTeamService from "./FirebaseTeamService";

class FirebaseGameService {
    public static async getGames(): Promise<GameWithRulesDTO[]> {
        const user = await getFirebaseUser();
        const ownedGames = await getDocs(query(
            getCollection<FirebaseGameDocument>("games"),
            where("ownerUid", "==", user.uid),
        ));
        const ownedGameDocuments = await Promise.all(
            ownedGames.docs.map((gameDoc) => this.ensureParticipantUids(gameDoc.data()))
        );
        const accessSnapshot = await getDocs(query(
            getCollection<FirebaseGameAccessDocument>("gameAccess"),
            where("participantUid", "==", user.uid),
        ));
        const sharedGames = await Promise.all(
            accessSnapshot.docs.map((accessDoc) => this.getGameDocumentById(accessDoc.data().gameId))
        );
        const visibleGames = new Map<string, FirebaseGameDocument>();

        ownedGameDocuments.forEach((game) => {
            visibleGames.set(`game-${game.id}`, game);
        });
        sharedGames.filter(Boolean).forEach((game) => {
            visibleGames.set(`game-${game!.id}`, game!);
        });

        return Array.from(visibleGames.values()).map(toGameWithRulesDTO);
    }

    public static async getGameById(id: number): Promise<GameWithRulesDTO | undefined> {
        const game = await this.getGameDocumentById(id);
        return game ? toGameWithRulesDTO(game) : undefined;
    }

    public static async addGame(game: GameAddDTO): Promise<GameWithRulesDTO> {
        const user = await getFirebaseUser();
        const gameId = game.id || await nextNumericId("games");
        const gameDocument: FirebaseGameDocument = {
            id: gameId,
            ownerUid: user.uid,
            participantUids: [user.uid],
            date: (game.date ?? new Date()).toISOString(),
            rules: toFirestoreRules(game.rules),
            teamIds: [],
            memberPlayerIds: [],
        };

        const { db } = getRequiredFirebase();
        await setDoc(doc(db, "games", `game-${gameId}`), gameDocument);
        await this.ensureGameAccess(gameDocument);
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
            teamName: team.name ?? `Team ${teamId}`,
            memberPlayerIds: team.memberPlayerIds,
        };

        const { db } = getRequiredFirebase();
        const participantUids = await this.getParticipantUids(team.memberPlayerIds, user.uid);
        const updatedGame: FirebaseGameDocument = {
            ...game,
            participantUids: Array.from(new Set([...(game.participantUids ?? [user.uid]), ...participantUids])),
            teamIds: Array.from(new Set([...(game.teamIds ?? []), teamId])),
            memberPlayerIds: Array.from(new Set([...(game.memberPlayerIds ?? []), ...team.memberPlayerIds])),
        };
        await setDoc(doc(db, "gameTeams", `gameTeam-${gameTeamId}`), gameTeamDocument);
        await setDoc(doc(db, "games", `game-${gameId}`), updatedGame, { merge: true });
        await this.ensureGameAccess(updatedGame);
    }

    public static async getTeamsByGameId(gameId: number): Promise<GameTeamDTO[]> {
        const snapshot = await getDocs(query(
            getCollection<FirebaseGameTeamDocument>("gameTeams"),
            where("gameId", "==", gameId),
        ));
        return Promise.all(snapshot.docs.map((gameTeamDoc) => this.toGameTeamDTO(gameTeamDoc.data())));
    }

    public static async getRoundsByGameId(gameId: number): Promise<GameRoundDTO[]> {
        const snapshot = await getDocs(query(
            getCollection<FirebaseGameRoundDocument>("rounds"),
            where("gameId", "==", gameId),
        ));
        const rounds = await Promise.all(snapshot.docs.map((roundDoc) => this.toRoundDTO(roundDoc.data())));
        return rounds.sort((a, b) =>
            (a.roundNumber ?? 0) - (b.roundNumber ?? 0) ||
            (a.gameTeam?.id ?? 0) - (b.gameTeam?.id ?? 0)
        );
    }

    public static async getRoundsByGameTeamId(gameTeamId: number): Promise<GameRoundDTO[]> {
        const gameTeam = await this.getGameTeamById(gameTeamId);
        if (!gameTeam) {
            return [];
        }

        const snapshot = await getDocs(query(
            getCollection<FirebaseGameRoundDocument>("rounds"),
            where("gameId", "==", gameTeam.gameId),
            where("gameTeamId", "==", gameTeamId),
        ));
        const rounds = await Promise.all(snapshot.docs.map((roundDoc) => this.toRoundDTO(roundDoc.data())));
        return rounds.sort((a, b) => (a.roundNumber ?? 0) - (b.roundNumber ?? 0));
    }

    public static async saveGameRound(gameId: number, round: GameRoundDTO): Promise<GameRoundDTO> {
        const savedRounds = await this.saveGameRounds(gameId, [round]);
        if (!savedRounds[0]) {
            throw new Error("Unable to save round scores.");
        }
        return savedRounds[0];
    }

    public static async saveGameRounds(gameId: number, rounds: GameRoundDTO[]): Promise<GameRoundDTO[]> {
        if (!rounds.length) {
            return [];
        }

        const user = await getFirebaseUser();
        const game = await this.getGameDocumentById(gameId, user.uid);
        if (!game) {
            throw new Error("Unable to save rounds for a missing game.");
        }

        const { db } = getRequiredFirebase();
        const [gameTeamsSnapshot, existingRoundsSnapshot] = await Promise.all([
            getDocs(query(
                getCollection<FirebaseGameTeamDocument>("gameTeams"),
                where("gameId", "==", gameId),
            )),
            getDocs(query(
                getCollection<FirebaseGameRoundDocument>("rounds"),
                where("gameId", "==", gameId),
            )),
        ]);
        const gameTeamsById = new Map(
            gameTeamsSnapshot.docs.map((gameTeamDoc) => [gameTeamDoc.data().id, gameTeamDoc.data()])
        );
        const existingRoundsByKey = new Map<string, { documentId: string; data: FirebaseGameRoundDocument }>(
            existingRoundsSnapshot.docs.map((roundDoc) => {
                const data = roundDoc.data();
                return [`${data.gameTeamId}:${data.roundNumber ?? 0}`, { documentId: roundDoc.id, data }] as const;
            })
        );
        const payloadKeys = new Set<string>();
        const batch = writeBatch(db);
        const savedRoundDocuments: FirebaseGameRoundDocument[] = [];

        for (const round of rounds) {
            const gameTeamId = round.gameTeam?.id ?? 0;
            const roundNumber = round.roundNumber ?? 0;
            const gameTeam = gameTeamsById.get(gameTeamId);
            const roundKey = `${gameTeamId}:${roundNumber}`;

            if (!gameTeamId || !gameTeam || gameTeam.ownerUid !== user.uid) {
                throw new Error("Unable to save round without a game team from this game.");
            }
            if (!Number.isInteger(roundNumber) || roundNumber < 1 || roundNumber > 4) {
                throw new Error("Round number must be between 1 and 4.");
            }
            if (payloadKeys.has(roundKey)) {
                throw new Error("A team can only have one score for each round.");
            }
            payloadKeys.add(roundKey);

            const existingRound = existingRoundsByKey.get(roundKey);
            const roundId = existingRound?.data.id ?? await nextNumericId("rounds");
            const roundDocument: FirebaseGameRoundDocument = {
                id: roundId,
                ownerUid: user.uid,
                gameId,
                gameTeamId,
                roundNumber,
                cardPoints: round.cardPoints ?? 0,
                handScore: round.handScore ?? 0,
                cleanBooks: round.cleanBooks ?? 0,
                dirtyBooks: round.dirtyBooks ?? 0,
                redThrees: round.redThrees ?? 0,
                pulledCorrect: round.pulledCorrect ?? 0,
                isWinner: round.isWinner ?? false,
            };
            const documentId = existingRound?.documentId ??
                `game-${gameId}-team-${gameTeamId}-round-${roundNumber}`;

            batch.set(doc(db, "rounds", documentId), roundDocument, { merge: true });
            savedRoundDocuments.push(roundDocument);
        }

        await batch.commit();
        return savedRoundDocuments.map((roundDocument, index) => Object.assign(
            new GameRoundDTO(),
            rounds[index],
            { id: roundDocument.id },
        ));
    }

    public static async getGameDocumentById(id: number, ownerUid?: string): Promise<FirebaseGameDocument | undefined> {
        const { db } = getRequiredFirebase();
        const snapshot = await getDoc(doc(db, "games", `game-${id}`));
        const game = snapshot.data() as FirebaseGameDocument | undefined;
        if (!game || game.id !== id || (ownerUid && game.ownerUid !== ownerUid)) {
            return undefined;
        }
        return game.ownerUid === (await getFirebaseUser()).uid
            ? this.ensureParticipantUids(game)
            : game;
    }

    private static async getGameTeamByGameAndTeam(gameId: number, teamId: number): Promise<FirebaseGameTeamDocument | undefined> {
        const snapshot = await getDocs(query(
            getCollection<FirebaseGameTeamDocument>("gameTeams"),
            where("gameId", "==", gameId),
        ));
        return snapshot.docs.map((gameTeamDoc) => gameTeamDoc.data()).find((gameTeam) => gameTeam.teamId === teamId);
    }

    private static async getGameTeamById(id: number): Promise<FirebaseGameTeamDocument | undefined> {
        const { db } = getRequiredFirebase();
        const snapshot = await getDoc(doc(db, "gameTeams", `gameTeam-${id}`));
        const gameTeam = snapshot.data() as FirebaseGameTeamDocument | undefined;
        return gameTeam?.id === id ? gameTeam : undefined;
    }

    private static async toGameTeamDTO(gameTeam: FirebaseGameTeamDocument): Promise<GameTeamDTO> {
        const game = await this.getGameDocumentById(gameTeam.gameId, gameTeam.ownerUid);
        if (!game) {
            throw new Error("Unable to map a game team without its game.");
        }

        const user = await getFirebaseUser();
        if (user.uid === gameTeam.ownerUid) {
            const team = await FirebaseTeamService.getTeamDocumentById(gameTeam.teamId, gameTeam.ownerUid);
            if (team) {
                if (!gameTeam.teamName && team.name) {
                    const { db } = getRequiredFirebase();
                    await setDoc(doc(db, "gameTeams", `gameTeam-${gameTeam.id}`), {
                        teamName: team.name,
                    }, { merge: true });
                }
                return toGameTeamDTO(gameTeam, game, await FirebaseTeamService.toTeamWithPlayers(team));
            }
        }

        return toGameTeamDTO(gameTeam, game, await FirebaseTeamService.toSharedGameTeam(gameTeam));
    }

    private static async toRoundDTO(round: FirebaseGameRoundDocument): Promise<GameRoundDTO> {
        const gameTeam = await this.getGameTeamById(round.gameTeamId);
        if (!gameTeam) {
            throw new Error("Unable to map Firebase round without a game team.");
        }

        return toGameRoundDTO(round, await this.toGameTeamDTO(gameTeam));
    }

    private static async ensureParticipantUids(game: FirebaseGameDocument): Promise<FirebaseGameDocument> {
        if (game.participantUids?.length) {
            return this.ensureGameAccess(game);
        }

        const participantUids = await this.getParticipantUids(game.memberPlayerIds, game.ownerUid);
        const updatedGame = { ...game, participantUids };
        const { db } = getRequiredFirebase();
        await setDoc(doc(db, "games", `game-${game.id}`), updatedGame, { merge: true });

        return this.ensureGameAccess(updatedGame);
    }

    private static async ensureGameAccess(game: FirebaseGameDocument): Promise<FirebaseGameDocument> {
        const participantUids = game.participantUids ?? [game.ownerUid];
        const provisionedUids = game.accessProvisionedUids ?? [];
        const alreadyProvisioned = participantUids.length === provisionedUids.length &&
            participantUids.every((uid) => provisionedUids.includes(uid));
        if (alreadyProvisioned) {
            return game;
        }

        const { db } = getRequiredFirebase();
        await Promise.all(participantUids.map((participantUid) => {
            const accessDocument: FirebaseGameAccessDocument = {
                gameId: game.id,
                ownerUid: game.ownerUid,
                participantUid,
            };
            return setDoc(
                doc(db, "gameAccess", `game-${game.id}-participant-${participantUid}`),
                accessDocument,
                { merge: true },
            );
        }));
        const updatedGame = { ...game, accessProvisionedUids: participantUids };
        await setDoc(doc(db, "games", `game-${game.id}`), updatedGame, { merge: true });
        return updatedGame;
    }

    private static async getParticipantUids(memberPlayerIds: number[], ownerUid: string): Promise<string[]> {
        const publicPlayers = await Promise.all(
            memberPlayerIds.map((playerId) => FirebasePlayerService.getPublicPlayerById(playerId))
        );
        return Array.from(new Set([
            ownerUid,
            ...publicPlayers.map((player) => player?.ownerUid).filter((uid): uid is string => !!uid),
        ]));
    }
}

export default FirebaseGameService;
