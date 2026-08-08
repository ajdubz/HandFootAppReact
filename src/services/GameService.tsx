import GameAddDTO from "../models/DTOs/Game/GameAddDTO";
import GameRoundDTO from "../models/DTOs/Game/GameRoundDTO";
import GameTeamDTO from "../models/DTOs/Game/GameTeamDTO";
import GameWithRulesDTO from "../models/DTOs/Game/GameWithRulesDTO";
import { apiRequest } from "./apiClient";
import { isFirebaseBackend } from "./apiConfig";
import FirebaseGameService from "./firebase/FirebaseGameService";
import MockApi from "./MockApi";

class GameService {
    public static async getGames(): Promise<GameWithRulesDTO[] | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.getGames();
        }

        if (isFirebaseBackend()) {
            return FirebaseGameService.getGames();
        }

        try {
            return await apiRequest<GameWithRulesDTO[]>("/Game", {
                method: "GET",
                fallbackErrorMessage: "Error in getGames",
            });
        } catch (error) {
            console.error("Error in getGames FE:", error);
            throw error;
        }
    }

    public static async getGameById(id: number): Promise<GameWithRulesDTO | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.getGameById(id);
        }

        if (isFirebaseBackend()) {
            return FirebaseGameService.getGameById(id);
        }

        try {
            return await apiRequest<GameWithRulesDTO>(`/Game/${id}`, {
                method: "GET",
                fallbackErrorMessage: "Error in getGameById",
            });
        } catch (error) {
            console.error("Error in getGameById FE:", error);
            throw error;
        }
    }

    public static async addGame(game: GameAddDTO): Promise<GameWithRulesDTO | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.addGame(game);
        }

        if (isFirebaseBackend()) {
            return FirebaseGameService.addGame(game);
        }

        try {
            return await apiRequest<GameWithRulesDTO>("/Game", {
                method: "POST",
                body: game,
                fallbackErrorMessage: "Error in addGame",
            });
        } catch (error) {
            console.error("Error in addGame FE:", error);
            throw error;
        }
    }

    public static async addTeamToGame(gameId: number, teamId: number) {
        if (MockApi.isEnabled()) {
            return MockApi.addTeamToGame(gameId, teamId);
        }

        if (isFirebaseBackend()) {
            return FirebaseGameService.addTeamToGame(gameId, teamId);
        }

        try {
            await apiRequest<void>(`/Game/${gameId}/team/${teamId}`, {
                method: "POST",
                fallbackErrorMessage: "Error in addTeamToGame",
            });
        } catch (error) {
            console.error("Error in addTeamToGame FE:", error);
            throw error;
        }
    }

    public static async getTeamsByGameId(gameId: number): Promise<GameTeamDTO[] | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.getTeamsByGameId(gameId);
        }

        if (isFirebaseBackend()) {
            return FirebaseGameService.getTeamsByGameId(gameId);
        }

        try {
            return await apiRequest<GameTeamDTO[]>(`/Game/${gameId}/team`, {
                method: "GET",
                fallbackErrorMessage: "Error in getTeamsByGameId",
            });
        } catch (error) {
            console.error("Error in getTeamsByGameId FE:", error);
            throw error;
        }
    }

    public static async getRoundsByGameId(gameId: number): Promise<GameRoundDTO[] | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.getRoundsByGameId(gameId);
        }

        if (isFirebaseBackend()) {
            return FirebaseGameService.getRoundsByGameId(gameId);
        }

        try {
            return await apiRequest<GameRoundDTO[]>(`/Game/${gameId}/round`, {
                method: "GET",
                fallbackErrorMessage: "Error in getRoundsByGameId",
            });
        } catch (error) {
            console.error("Error in getRoundsByGameId FE:", error);
            throw error;
        }
    }

    public static async saveGameRound(gameId: number, round: GameRoundDTO): Promise<GameRoundDTO | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.saveGameRound(gameId, round);
        }

        if (isFirebaseBackend()) {
            return FirebaseGameService.saveGameRound(gameId, round);
        }

        try {
            return await apiRequest<GameRoundDTO>(`/Game/${gameId}/round`, {
                method: "POST",
                body: round,
                fallbackErrorMessage: "Error in saveGameRound",
            });
        } catch (error) {
            console.error("Error in saveGameRound FE:", error);
            throw error;
        }
    }

    public static async saveGameRounds(gameId: number, rounds: GameRoundDTO[]): Promise<GameRoundDTO[]> {
        if (MockApi.isEnabled()) {
            const savedRounds: GameRoundDTO[] = [];
            for (const round of rounds) {
                savedRounds.push(await MockApi.saveGameRound(gameId, round));
            }
            return savedRounds;
        }

        if (isFirebaseBackend()) {
            return FirebaseGameService.saveGameRounds(gameId, rounds);
        }

        const savedRounds: GameRoundDTO[] = [];
        for (const round of rounds) {
            const savedRound = await this.saveGameRound(gameId, round);
            if (savedRound) {
                savedRounds.push(savedRound);
            }
        }
        return savedRounds;
    }
}

export default GameService;
