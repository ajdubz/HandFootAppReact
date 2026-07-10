import GameAddDTO from "../models/DTOs/Game/GameAddDTO";
import GameRoundDTO from "../models/DTOs/Game/GameRoundDTO";
import GameTeamDTO from "../models/DTOs/Game/GameTeamDTO";
import GameWithRulesDTO from "../models/DTOs/Game/GameWithRulesDTO";
import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import PlayerFriendBasicDTO from "../models/DTOs/Player/PlayerFriendBasicDTO";
import PlayerFullDetailsDTO from "../models/DTOs/Player/PlayerFullDetailsDTO";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import PlayerLoginDTO from "../models/DTOs/Player/PlayerLoginDTO";
import GetTeamsByPlayerIdsDTO from "../models/DTOs/Team/GetTeamsByPlayerIdsDTO";
import PlayerTeamCreateDTO from "../models/DTOs/Team/PlayerTeamCreateDTO";
import TeamCreateDTO from "../models/DTOs/Team/TeamCreateDTO";
import TeamGetBasicDTO from "../models/DTOs/Team/TeamGetBasicDTO";
import TeamGetWithPlayerNamesDTO from "../models/DTOs/Team/TeamGetWithPlayerNamesDTO";
import { normalizeRules } from "../rules/rulesDefaults";
import { isMockApiConfigured } from "./apiConfig";

type MockState = {
    stateVersion?: number;
    players: PlayerAccountDTO[];
    teams: TeamGetWithPlayerNamesDTO[];
    friendships: PlayerFriendBasicDTO[];
    friendRequests: PlayerFriendBasicDTO[];
    games: GameWithRulesDTO[];
    gameTeams: GameTeamDTO[];
    rounds: GameRoundDTO[];
};

const MOCK_STATE_KEY = "handfoot.mockState";
const MOCK_STATE_VERSION = 2;

class MockApi {
    public static isEnabled() {
        return isMockApiConfigured();
    }

    public static reset() {
        this.saveState(this.seedState());
    }

    public static async login(player: PlayerAccountDTO): Promise<PlayerLoginDTO | undefined> {
        const state = this.getState();
        const foundPlayer = state.players.find((p) => {
            const identifierMatches = !!player.email &&
                p.email?.toLowerCase() === player.email.toLowerCase();

            const passwordMatches = (p.password ?? "") === (player.password ?? "");
            return identifierMatches && passwordMatches;
        });

        if (!foundPlayer) {
            return undefined;
        }

        const login = new PlayerLoginDTO();
        login.id = foundPlayer.id;
        login.nickName = foundPlayer.nickName;
        login.email = foundPlayer.email;
        login.token = `mock-token-${foundPlayer.id}`;
        localStorage.setItem("token", login.token);
        localStorage.setItem("mockPlayerId", String(foundPlayer.id ?? 1));
        return login;
    }

    public static async startGuestSession(): Promise<PlayerLoginDTO> {
        const state = this.getState();
        let guestPlayer = state.players.find((player) => player.email === "guest@mock.local");

        if (!guestPlayer) {
            guestPlayer = {
                id: this.nextId(state.players),
                nickName: "Guest Player",
                fullName: "Guest Player",
                email: "guest@mock.local",
                password: "guest",
                isGuest: true,
            };
            state.players.push(guestPlayer);
            this.saveState(state);
        }

        const login = new PlayerLoginDTO();
        login.id = guestPlayer.id;
        login.nickName = guestPlayer.nickName;
        login.email = guestPlayer.email;
        login.token = `guest-token-${guestPlayer.id}`;
        return login;
    }

    public static async getPlayers(): Promise<PlayerGetBasicDTO[]> {
        return this.getState().players.map((p) => this.toBasicPlayer(p));
    }

    public static async getPlayerAccountById(id: number): Promise<PlayerAccountDTO | undefined> {
        return this.getState().players.find((p) => p.id === id);
    }

    public static async getPlayerFullDetailsById(id: number): Promise<PlayerFullDetailsDTO> {
        const state = this.getState();
        const player = state.players.find((p) => p.id === id);
        const details = new PlayerFullDetailsDTO();
        details.nickName = player?.nickName ?? "";
        details.fullName = player?.fullName ?? "";
        details.friends = this.friendIdsFor(state, id).map((friendId) => this.toBasicPlayerById(state, friendId)).filter(Boolean) as PlayerGetBasicDTO[];
        details.gameTeams = state.gameTeams.filter((gameTeam) => gameTeam.team?.teamMembers?.some((member) => member.id === id));
        return details;
    }

    public static async createPlayer(player: PlayerAccountDTO): Promise<PlayerAccountDTO> {
        const state = this.getState();
        const normalizedNickName = (player.nickName ?? "").trim().toLowerCase();
        const normalizedEmail = (player.email ?? "").trim().toLowerCase();
        const duplicatePlayer = state.players.find((existingPlayer) =>
            (existingPlayer.nickName ?? "").trim().toLowerCase() === normalizedNickName ||
            (existingPlayer.email ?? "").trim().toLowerCase() === normalizedEmail
        );

        if (duplicatePlayer) {
            throw new Error("An account with that nickname or email already exists.");
        }

        const newPlayer = { ...player, id: this.nextId(state.players) };
        state.players.push(newPlayer);
        this.saveState(state);
        return newPlayer;
    }

    public static async createGuest(player: PlayerAccountDTO): Promise<PlayerAccountDTO> {
        const state = this.getState();
        const nextGuestId = this.nextId(state.players);

        return this.createPlayer({
            ...player,
            email: player.email || `guest${nextGuestId}@mock.local`,
            password: player.password || "guest",
            isGuest: true,
        });
    }

    public static async updatePlayerAccount(playerId: number, player: PlayerAccountDTO) {
        const state = this.getState();
        const normalizedNickName = (player.nickName ?? "").trim().toLowerCase();
        const normalizedEmail = (player.email ?? "").trim().toLowerCase();
        const duplicatePlayer = state.players.find((existingPlayer) =>
            existingPlayer.id !== playerId &&
            (
                (existingPlayer.nickName ?? "").trim().toLowerCase() === normalizedNickName ||
                (existingPlayer.email ?? "").trim().toLowerCase() === normalizedEmail
            )
        );

        if (duplicatePlayer) {
            throw new Error("An account with that nickname or email already exists.");
        }

        const index = state.players.findIndex((p) => p.id === playerId);
        if (index >= 0) {
            state.players[index] = { ...state.players[index], ...player, id: playerId };
            this.saveState(state);
        }
    }

    public static async deletePlayer(playerId: number) {
        const state = this.getState();
        state.players = state.players.filter((p) => p.id !== playerId);
        state.friendships = state.friendships.filter((f) => f.playerId !== playerId && f.friendId !== playerId);
        state.friendRequests = state.friendRequests.filter((f) => f.playerId !== playerId && f.friendId !== playerId);
        this.saveState(state);
    }

    public static async searchPlayers(search: string): Promise<PlayerGetBasicDTO[]> {
        return this.getState().players.filter((p) => this.matchesPlayer(p, search)).map((p) => this.toBasicPlayer(p));
    }

    public static async getFriends(id: number): Promise<PlayerGetBasicDTO[]> {
        const state = this.getState();
        return this.friendIdsFor(state, id).map((friendId) => this.toBasicPlayerById(state, friendId)).filter(Boolean) as PlayerGetBasicDTO[];
    }

    public static async getFriendRequests(id: number): Promise<PlayerGetBasicDTO[]> {
        const state = this.getState();
        return state.friendRequests.filter((f) => f.friendId === id).map((f) => this.toBasicPlayerById(state, f.playerId ?? 0)).filter(Boolean) as PlayerGetBasicDTO[];
    }

    public static async getSentFriendRequests(id: number): Promise<PlayerGetBasicDTO[]> {
        const state = this.getState();
        return state.friendRequests.filter((f) => f.playerId === id).map((f) => this.toBasicPlayerById(state, f.friendId ?? 0)).filter(Boolean) as PlayerGetBasicDTO[];
    }

    public static async sendFriendRequest(id: number, playerFriend: PlayerFriendBasicDTO) {
        const state = this.getState();
        const request = { playerId: id, friendId: playerFriend.friendId };
        if (!state.friendRequests.some((f) => f.playerId === request.playerId && f.friendId === request.friendId)) {
            state.friendRequests.push(request);
        }
        this.saveState(state);
    }

    public static async acceptFriendRequest(id: number, playerFriend: PlayerFriendBasicDTO) {
        const state = this.getState();
        const friendId = playerFriend.friendId ?? 0;
        state.friendRequests = state.friendRequests.filter((f) => !(f.playerId === friendId && f.friendId === id));
        if (!state.friendships.some((f) => f.playerId === id && f.friendId === friendId)) {
            state.friendships.push({ playerId: id, friendId });
        }
        this.saveState(state);
    }

    public static async declineFriendRequest(id: number, playerFriend: PlayerFriendBasicDTO) {
        const state = this.getState();
        const friendId = playerFriend.friendId ?? 0;
        state.friendRequests = state.friendRequests.filter((f) => !(f.playerId === friendId && f.friendId === id));
        this.saveState(state);
    }

    public static async removeFriend(id: number, playerFriend: PlayerFriendBasicDTO) {
        const state = this.getState();
        const friendId = playerFriend.friendId ?? 0;
        state.friendships = state.friendships.filter((f) => !this.isFriendship(f, id, friendId));
        this.saveState(state);
    }

    public static async searchNewFriends(playerId: number, search: string): Promise<PlayerGetBasicDTO[]> {
        const state = this.getState();
        const existingFriendIds = new Set(this.friendIdsFor(state, playerId));
        const sentRequestIds = new Set(state.friendRequests
            .filter((request) => request.playerId === playerId)
            .map((request) => request.friendId ?? 0));
        const incomingRequestIds = new Set(state.friendRequests
            .filter((request) => request.friendId === playerId)
            .map((request) => request.playerId ?? 0));
        return state.players
            .filter((p) => {
                const candidateId = p.id ?? 0;
                return candidateId !== playerId &&
                    !existingFriendIds.has(candidateId) &&
                    !sentRequestIds.has(candidateId) &&
                    !incomingRequestIds.has(candidateId) &&
                    this.matchesPlayer(p, search);
            })
            .map((p) => this.toBasicPlayer(p));
    }

    public static async searchCurrentFriends(playerId: number, search: string): Promise<PlayerGetBasicDTO[]> {
        return (await this.getFriends(playerId)).filter((p) => this.matchesPlayer(p, search));
    }

    public static async getTeamsWithPlayerNames(): Promise<TeamGetWithPlayerNamesDTO[]> {
        return this.getState().teams;
    }

    public static async getTeamById(id: number): Promise<TeamGetBasicDTO> {
        const team = this.getState().teams.find((t) => t.id === id);
        return { id: team?.id ?? 0, name: team?.name ?? "" };
    }

    public static async createTeam(team: TeamCreateDTO): Promise<TeamCreateDTO> {
        const state = this.getState();
        const newTeam = { id: this.nextId(state.teams), name: team.name ?? "New Team", teamMembers: [] };
        state.teams.push(newTeam);
        this.saveState(state);
        return { id: newTeam.id, name: newTeam.name };
    }

    public static async searchTeams(searchText: string): Promise<TeamGetBasicDTO[]> {
        return this.getState().teams
            .filter((team) => this.matchesText(team.name, searchText))
            .map((team) => ({ id: team.id, name: team.name }));
    }

    public static async searchPlayerTeams(inId: number, searchText: string): Promise<TeamGetWithPlayerNamesDTO[]> {
        return this.getState().teams.filter((team) =>
            team.teamMembers?.some((member) => member.id === inId) && this.matchesText(team.name, searchText)
        );
    }

    public static async getTeamsByPlayers(getTeamsByPlayers: GetTeamsByPlayerIdsDTO): Promise<TeamGetWithPlayerNamesDTO[]> {
        return this.getState().teams.filter((team) => {
            const memberIds = team.teamMembers?.map((member) => member.id) ?? [];
            return memberIds.includes(getTeamsByPlayers.player1Id) &&
                (!getTeamsByPlayers.player2Id || memberIds.includes(getTeamsByPlayers.player2Id));
        });
    }

    public static async addPlayersToNewTeam(playerTeamCreate: PlayerTeamCreateDTO): Promise<TeamGetWithPlayerNamesDTO> {
        const state = this.getState();
        const members = [playerTeamCreate.playerId1, playerTeamCreate.playerId2]
            .filter((id): id is number => !!id)
            .map((id) => this.toBasicPlayerById(state, id))
            .filter(Boolean) as PlayerGetBasicDTO[];
        const team = {
            id: playerTeamCreate.teamId || this.nextId(state.teams),
            name: playerTeamCreate.teamName || "New Team",
            teamMembers: members,
        };
        state.teams.push(team);
        this.saveState(state);
        return team;
    }

    public static async getGames(): Promise<GameWithRulesDTO[]> {
        return this.getState().games;
    }

    public static async getGameById(id: number): Promise<GameWithRulesDTO | undefined> {
        return this.getState().games.find((game) => game.id === id);
    }

    public static async addGame(game: GameAddDTO): Promise<GameWithRulesDTO> {
        const state = this.getState();
        const newGame = new GameWithRulesDTO();
        newGame.id = this.nextId(state.games);
        newGame.date = game.date ?? new Date();
        newGame.rules = normalizeRules(game.rules);
        state.games.push(newGame);
        this.saveState(state);
        return newGame;
    }

    public static async addTeamToGame(gameId: number, teamId: number) {
        const state = this.getState();
        const team = state.teams.find((t) => t.id === teamId);
        const game = state.games.find((g) => g.id === gameId);
        if (team && game && !state.gameTeams.some((gt) => gt.game?.id === gameId && gt.team?.id === teamId)) {
            state.gameTeams.push({ id: this.nextId(state.gameTeams), game, team });
        }
        this.saveState(state);
    }

    public static async getTeamsByGameId(gameId: number): Promise<GameTeamDTO[]> {
        return this.getState().gameTeams.filter((gameTeam) => gameTeam.game?.id === gameId);
    }

    public static async getRoundsByGameId(gameId: number): Promise<GameRoundDTO[]> {
        return this.getState().rounds.filter((round) => round.gameTeam?.game?.id === gameId);
    }

    public static async getRoundsByTeamId(gameTeamId: number): Promise<GameRoundDTO[]> {
        return this.getState().rounds.filter((round) => round.gameTeam?.id === gameTeamId);
    }

    public static async deletePreviousGamesForPlayerTeam(playerId: number, teamId: number) {
        const state = this.getState();
        const matchingGameTeams = state.gameTeams.filter((gameTeam) =>
            gameTeam.team?.id === teamId &&
            gameTeam.team?.teamMembers?.some((member) => member.id === playerId)
        );

        const matchingGameTeamIds = new Set(matchingGameTeams.map((gameTeam) => gameTeam.id ?? 0));
        const matchingGameIds = new Set(matchingGameTeams.map((gameTeam) => gameTeam.game?.id ?? 0));

        state.rounds = state.rounds.filter((round) => !matchingGameTeamIds.has(round.gameTeam?.id ?? 0));
        state.gameTeams = state.gameTeams.filter((gameTeam) => !matchingGameTeamIds.has(gameTeam.id ?? 0));
        state.games = state.games.filter((game) => !matchingGameIds.has(game.id ?? 0));
        state.teams = state.teams
            .map((team) => {
                if (team.id !== teamId) {
                    return team;
                }

                return {
                    ...team,
                    teamMembers: (team.teamMembers ?? []).filter((member) => member.id !== playerId),
                };
            })
            .filter((team) => (team.teamMembers?.length ?? 0) > 0);

        this.saveState(state);
    }

    public static async saveGameRound(gameId: number, round: GameRoundDTO): Promise<GameRoundDTO> {
        const state = this.getState();
        const gameTeamId = round.gameTeam?.id ?? 0;
        const gameTeam = state.gameTeams.find((gt) => gt.id === gameTeamId && gt.game?.id === gameId);

        if (!gameTeam) {
            throw new Error("Unable to save round for missing game team");
        }

        const savedRound = {
            ...round,
            id: round.id || this.nextId(state.rounds),
            gameTeam,
        };

        const existingIndex = state.rounds.findIndex((r) =>
            r.gameTeam?.id === gameTeamId && r.roundNumber === savedRound.roundNumber
        );

        if (existingIndex >= 0) {
            state.rounds[existingIndex] = { ...state.rounds[existingIndex], ...savedRound };
        } else {
            state.rounds.push(savedRound);
        }

        this.saveState(state);
        return savedRound;
    }

    private static getState(): MockState {
        const rawState = localStorage.getItem(MOCK_STATE_KEY);
        if (rawState) {
            const parsedState = JSON.parse(rawState) as MockState;
            const migratedState = this.migrateState(parsedState);
            this.saveState(migratedState);
            return migratedState;
        }

        const state = this.seedState(true);
        this.saveState(state);
        return state;
    }

    private static saveState(state: MockState) {
        localStorage.setItem(MOCK_STATE_KEY, JSON.stringify({ ...state, stateVersion: MOCK_STATE_VERSION }));
    }

    private static seedState(clearTeams: boolean = false): MockState {
        const players = [
            { id: 1, nickName: "Alex", fullName: "Alex Davis", email: "alex@example.com", password: "password", isGuest: false },
            { id: 2, nickName: "Sam", fullName: "Sam Taylor", email: "sam@example.com", password: "password", isGuest: false },
            { id: 3, nickName: "Jordan", fullName: "Jordan Lee", email: "jordan@example.com", password: "password", isGuest: false },
            { id: 4, nickName: "Casey", fullName: "Casey Morgan", email: "casey@example.com", password: "password", isGuest: false },
        ];
        const teams = clearTeams ? [] : [
            { id: 1, name: "Alex and Sam", teamMembers: [this.toBasicPlayer(players[0]), this.toBasicPlayer(players[1])] },
            { id: 2, name: "Jordan and Casey", teamMembers: [this.toBasicPlayer(players[2]), this.toBasicPlayer(players[3])] },
        ];
        const game = new GameWithRulesDTO();
        game.id = 1;
        game.date = new Date();
        const gameTeams = clearTeams ? [] : [
            { id: 1, game, team: teams[0] },
            { id: 2, game, team: teams[1] },
        ];

        return {
            stateVersion: MOCK_STATE_VERSION,
            players,
            teams,
            friendships: [
                { playerId: 1, friendId: 2 },
                { playerId: 1, friendId: 3 },
                { playerId: 2, friendId: 4 },
            ],
            friendRequests: [{ playerId: 4, friendId: 1 }],
            games: clearTeams ? [] : [game],
            gameTeams,
            rounds: [],
        };
    }

    private static migrateState(state: MockState): MockState {
        if ((state.stateVersion ?? 1) >= MOCK_STATE_VERSION) {
            return state;
        }

        return {
            ...state,
            stateVersion: MOCK_STATE_VERSION,
            teams: [],
            games: [],
            gameTeams: [],
            rounds: [],
        };
    }

    private static toBasicPlayer(player: PlayerAccountDTO): PlayerGetBasicDTO {
        return {
            id: player.id,
            nickName: player.nickName,
            fullName: player.fullName,
            email: player.email,
            isGuest: player.isGuest ?? false,
        };
    }

    private static toBasicPlayerById(state: MockState, id: number): PlayerGetBasicDTO | undefined {
        const player = state.players.find((p) => p.id === id);
        return player ? this.toBasicPlayer(player) : undefined;
    }

    private static friendIdsFor(state: MockState, id: number): number[] {
        return state.friendships
            .filter((f) => f.playerId === id || f.friendId === id)
            .map((f) => f.playerId === id ? f.friendId : f.playerId)
            .filter((friendId): friendId is number => !!friendId);
    }

    private static isFriendship(friendship: PlayerFriendBasicDTO, playerId: number, friendId: number): boolean {
        return (friendship.playerId === playerId && friendship.friendId === friendId) ||
            (friendship.playerId === friendId && friendship.friendId === playerId);
    }

    private static matchesPlayer(player: PlayerAccountDTO | PlayerGetBasicDTO, search: string): boolean {
        return this.matchesText(player.nickName, search) || this.matchesText(player.fullName, search);
    }

    private static matchesText(value: string | undefined, search: string): boolean {
        return (value ?? "").toLowerCase().includes(search.toLowerCase());
    }

    private static nextId(items: Array<{ id?: number }>): number {
        return Math.max(0, ...items.map((item) => item.id ?? 0)) + 1;
    }
}

export default MockApi;
