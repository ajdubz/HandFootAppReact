import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import PlayerFullDetailsDTO from "../models/DTOs/Player/PlayerFullDetailsDTO";
import PlayerLoginDTO from "../models/DTOs/Player/PlayerLoginDTO";
import { getAuthToken, hasAuthToken, setAuthState, setGuestAuthState } from "../utils/auth";
import { apiRequest } from "./apiClient";
import { isFirebaseBackend } from "./apiConfig";
import FirebasePlayerService from "./firebase/FirebasePlayerService";
import MockApi from "./MockApi";

class PlayerService {

    public static async LoginPlayer(playerAccountDTO: PlayerAccountDTO): Promise<PlayerLoginDTO | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.login(playerAccountDTO);
        }

        if (isFirebaseBackend()) {
            const data = await FirebasePlayerService.LoginPlayer(playerAccountDTO);
            setAuthState(data?.id, data?.token ?? "");
            return data;
        }

        try {
            const data = await apiRequest<PlayerLoginDTO>("/auth/login", {
                method: "POST",
                authenticated: false,
                body: playerAccountDTO,
                fallbackErrorMessage: "Error in LoginPlayer FE",
            });

            setAuthState(data?.id, data?.token ?? "");
            return data;
        } catch (error) {
            console.error("Error in LoginPlayer FE:", error);
            throw error;
        }
    }

    public static async startGuestSession(): Promise<PlayerLoginDTO> {
        if (MockApi.isEnabled()) {
            const login = await MockApi.startGuestSession();
            setGuestAuthState(login.id, login.token ?? "");
            return login;
        }

        if (isFirebaseBackend()) {
            const login = await FirebasePlayerService.startGuestSession();
            setGuestAuthState(login.id, login.token ?? "");
            return login;
        }

        try {
            const login = await apiRequest<PlayerLoginDTO>("/auth/guest", {
                method: "POST",
                authenticated: false,
                fallbackErrorMessage: "Error in startGuestSession FE",
            });

            setAuthState(login.id, login.token ?? "");
            return login;
        } catch (error) {
            console.error("Error in startGuestSession FE:", error);
            throw error;
        }
    }

    public static async getPlayers(): Promise<PlayerGetBasicDTO[] | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.getPlayers();
        }

        if (isFirebaseBackend()) {
            return FirebasePlayerService.getPlayers();
        }

        try {
            return await apiRequest<PlayerGetBasicDTO[]>("/Player", {
                method: "GET",
                fallbackErrorMessage: "Error in getPlayers",
            });
        } catch (error) {
            console.error("Error in getPlayers FE:", error);
            throw error;
        }
    }

    public static async getPlayerAccountById(id: number): Promise<PlayerAccountDTO | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.getPlayerAccountById(id);
        }

        if (isFirebaseBackend()) {
            return FirebasePlayerService.getPlayerAccountById(id);
        }

        try {
            return await apiRequest<PlayerAccountDTO>(`/Player/${id}/account`, {
                method: "GET",
                fallbackErrorMessage: "Error in getPlayerAccountById",
            });
        } catch (error) {
            console.error("Error in getPlayerAccountById FE:", error);
            throw error;
        }
    }

    public static async getPlayerFullDetailsById(id: number): Promise<PlayerFullDetailsDTO> {
        if (MockApi.isEnabled()) {
            return MockApi.getPlayerFullDetailsById(id);
        }

        if (isFirebaseBackend()) {
            return FirebasePlayerService.getPlayerFullDetailsById(id);
        }

        try {
            if (!getAuthToken()) {
                window.location.href = "/login";
                throw new Error("No token found");
            }

            return await apiRequest<PlayerFullDetailsDTO>(`/Player/${id}`, {
                method: "GET",
                fallbackErrorMessage: "Error in getPlayerFullDetailsById",
            });
        } catch (error) {
            console.error("Error in getPlayerFullDetailsById FE:", error);
            throw error;
        }
    }

    public static async createPlayer(player: PlayerAccountDTO): Promise<PlayerAccountDTO> {
        if (MockApi.isEnabled()) {
            return MockApi.createPlayer(player);
        }

        if (isFirebaseBackend()) {
            return FirebasePlayerService.createPlayer(player);
        }

        try {
            return await apiRequest<PlayerAccountDTO>("/Player/account", {
                method: "POST",
                authenticated: false,
                body: player,
                fallbackErrorMessage: "Error in createPlayer",
            });
        } catch (error) {
            console.log(player);
            console.error("Error in createPlayer FE:", error);
            throw error;
        }
    }

    public static async createGuest(player: PlayerAccountDTO): Promise<PlayerAccountDTO> {
        if (MockApi.isEnabled()) {
            return MockApi.createGuest(player);
        }

        if (isFirebaseBackend()) {
            return FirebasePlayerService.createGuest(player);
        }

        try {
            return await apiRequest<PlayerAccountDTO>("/Player/guest", {
                method: "POST",
                body: player,
                fallbackErrorMessage: "Error in createGuest",
            });
        } catch (error) {
            console.log(player);
            console.error("Error in createGuest FE:", error);
            throw error;
        }
    }

    public static async updatePlayerAccount(playerId: number, player: PlayerAccountDTO) {
        if (MockApi.isEnabled()) {
            return MockApi.updatePlayerAccount(playerId, player);
        }

        if (isFirebaseBackend()) {
            return FirebasePlayerService.updatePlayerAccount(playerId, player);
        }

        try {
            await apiRequest<void>(`/Player/${playerId}/account`, {
                method: "PUT",
                body: player,
                fallbackErrorMessage: "Error in updatePlayerAccount",
            });
        } catch (error) {
            console.error("Error in updatePlayer FE:", error);
            throw error;
        }
    }

    public static async deletePlayer(playerId: number) {
        if (MockApi.isEnabled()) {
            return MockApi.deletePlayer(playerId);
        }

        if (isFirebaseBackend()) {
            return FirebasePlayerService.deletePlayer(playerId);
        }

        try {
            await apiRequest<void>(`/Player/${playerId}/account`, {
                method: "DELETE",
                fallbackErrorMessage: "Error in deletePlayer",
            });
        } catch (error) {
            console.error("Error in deletePlayer FE:", error);
            throw error;
        }
    }

    public static async searchPlayers(search: string): Promise<PlayerGetBasicDTO[] | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.searchPlayers(search);
        }

        if (isFirebaseBackend()) {
            return FirebasePlayerService.searchPlayers(search);
        }

        try {
            return await apiRequest<PlayerGetBasicDTO[]>(`/Player/search/${search}`, {
                method: "GET",
                fallbackErrorMessage: "Error in searchPlayers",
            });
        } catch (error) {
            console.error("Error in searchPlayers FE:", error);
            throw error;
        }
    }

    public static getIsAuthenticated() {
        return hasAuthToken();
    }

}

export default PlayerService;
