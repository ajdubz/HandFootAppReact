import GameRoundDTO from "../models/DTOs/Game/GameRoundDTO";
import GetTeamsByPlayerIdsDTO from "../models/DTOs/Team/GetTeamsByPlayerIdsDTO";
import PlayerTeamCreateDTO from "../models/DTOs/Team/PlayerTeamCreateDTO";
import TeamCreateDTO from "../models/DTOs/Team/TeamCreateDTO";
import TeamGetBasicDTO from "../models/DTOs/Team/TeamGetBasicDTO";
import TeamGetWithPlayerNamesDTO from "../models/DTOs/Team/TeamGetWithPlayerNamesDTO";
import { apiRequest } from "./apiClient";
import { isFirebaseBackend } from "./apiConfig";
import FirebaseTeamService from "./firebase/FirebaseTeamService";
import MockApi from "./MockApi";

class TeamService {

    public static async getTeamsWithPlayerNames(): Promise<TeamGetWithPlayerNamesDTO[] | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.getTeamsWithPlayerNames();
        }

        if (isFirebaseBackend()) {
            return FirebaseTeamService.getTeamsWithPlayerNames();
        }

        try {
            return await apiRequest<TeamGetWithPlayerNamesDTO[]>("/Team/Names", {
                method: "GET",
                fallbackErrorMessage: "Error in getTeams",
            });
        } catch (error) {
            console.error("Error in getTeams FE:", error);
            throw error;
        }
    }

    public static async getTeamById(id: number): Promise<TeamGetBasicDTO> {
        if (MockApi.isEnabled()) {
            return MockApi.getTeamById(id);
        }

        if (isFirebaseBackend()) {
            return FirebaseTeamService.getTeamById(id);
        }

        try {
            return await apiRequest<TeamGetBasicDTO>(`/Team/${id}`, {
                method: "GET",
                fallbackErrorMessage: "Error in getTeamById",
            });
        } catch (error) {
            console.error("Error in getTeamById FE:", error);
            throw error;
        }
    }

    public static async createTeam(team: TeamCreateDTO): Promise<TeamCreateDTO> {
        if (MockApi.isEnabled()) {
            return MockApi.createTeam(team);
        }

        if (isFirebaseBackend()) {
            return FirebaseTeamService.createTeam(team);
        }

        try {
            return await apiRequest<TeamCreateDTO>("/Team", {
                method: "POST",
                body: team,
                fallbackErrorMessage: "Error in createTeam",
            });
        } catch (error) {
            console.error("Error in createTeam FE:", error);
            throw error;
        }
    }

    public static async searchTeams(searchText: string): Promise<TeamGetBasicDTO[] | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.searchTeams(searchText);
        }

        if (isFirebaseBackend()) {
            return FirebaseTeamService.searchTeams(searchText);
        }

        try {
            return await apiRequest<TeamGetBasicDTO[]>(`/Team/search/${searchText}`, {
                method: "GET",
                fallbackErrorMessage: "Error in searchTeams",
            });
        } catch (error) {
            console.error("Error in searchTeams FE:", error);
            throw error;
        }
    }

    public static async searchPlayerTeams(inId: number, searchText: string): Promise<TeamGetWithPlayerNamesDTO[] | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.searchPlayerTeams(inId, searchText);
        }

        if (isFirebaseBackend()) {
            return FirebaseTeamService.searchPlayerTeams(inId, searchText);
        }

        try {
            return await apiRequest<TeamGetWithPlayerNamesDTO[]>(`/Team/search/${inId}-${searchText}`, {
                method: "GET",
                fallbackErrorMessage: "Error in searchPlayerTeams",
            });
        } catch (error) {
            console.error("Error in searchPlayerTeams FE:", error);
            throw error;
        }
    }

    public static async getTeamsByPlayers(getTeamsByPlayers: GetTeamsByPlayerIdsDTO): Promise<TeamGetWithPlayerNamesDTO[] | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.getTeamsByPlayers(getTeamsByPlayers);
        }

        if (isFirebaseBackend()) {
            return FirebaseTeamService.getTeamsByPlayers(getTeamsByPlayers);
        }

        try {
            return await apiRequest<TeamGetWithPlayerNamesDTO[]>("/Team/Players", {
                method: "POST",
                body: getTeamsByPlayers,
                fallbackErrorMessage: "Error in getTeamsByPlayers",
            });
        } catch (error) {
            console.error("Error in getTeamsByPlayers FE:", error);
            throw error;
        }
    }

    public static async addPlayersToNewTeam(playerTeamCreate: PlayerTeamCreateDTO): Promise<TeamGetWithPlayerNamesDTO | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.addPlayersToNewTeam(playerTeamCreate);
        }

        if (isFirebaseBackend()) {
            return FirebaseTeamService.addPlayersToNewTeam(playerTeamCreate);
        }

        try {
            return await apiRequest<TeamGetWithPlayerNamesDTO>("/Team/Player", {
                method: "POST",
                body: playerTeamCreate,
                fallbackErrorMessage: "Error in addPlayersToTeam",
            });
        } catch (error) {
            console.error("Error in addPlayerToTeam FE:", error);
            throw error;
        }
    }

    public static async getRoundsByTeamId(gameTeamId: number): Promise<GameRoundDTO[] | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.getRoundsByTeamId(gameTeamId);
        }

        if (isFirebaseBackend()) {
            return FirebaseTeamService.getRoundsByTeamId(gameTeamId);
        }

        try {
            return await apiRequest<GameRoundDTO[]>(`/Team/${gameTeamId}/round`, {
                method: "GET",
                fallbackErrorMessage: "Error in getRoundsByTeamId",
            });
        } catch (error) {
            console.error("Error in getRoundsByTeamId FE:", error);
            throw error;
        }
    }

    public static async deletePreviousGamesForPlayerTeam(playerId: number, teamId: number): Promise<void> {
        if (MockApi.isEnabled()) {
            return MockApi.deletePreviousGamesForPlayerTeam(playerId, teamId);
        }

        if (isFirebaseBackend()) {
            return FirebaseTeamService.deletePreviousGamesForPlayerTeam(playerId, teamId);
        }

        try {
            await apiRequest<void>(`/Team/${teamId}/Player/${playerId}/games`, {
                method: "DELETE",
                fallbackErrorMessage: "Error in deletePreviousGamesForPlayerTeam",
            });
        } catch (error) {
            console.error("Error in deletePreviousGamesForPlayerTeam FE:", error);
            throw error;
        }
    }

}

export default TeamService;
