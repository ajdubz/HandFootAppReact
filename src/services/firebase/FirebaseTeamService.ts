import { doc, getDocs, query, setDoc, where } from "firebase/firestore";
import GameRoundDTO from "../../models/DTOs/Game/GameRoundDTO";
import GetTeamsByPlayerIdsDTO from "../../models/DTOs/Team/GetTeamsByPlayerIdsDTO";
import PlayerTeamCreateDTO from "../../models/DTOs/Team/PlayerTeamCreateDTO";
import TeamCreateDTO from "../../models/DTOs/Team/TeamCreateDTO";
import TeamGetBasicDTO from "../../models/DTOs/Team/TeamGetBasicDTO";
import TeamGetWithPlayerNamesDTO from "../../models/DTOs/Team/TeamGetWithPlayerNamesDTO";
import { getCollection, getFirebaseUser, getOwnedByNumericId, getRequiredFirebase, nextNumericId } from "./firebaseRepository";
import { FirebaseGameTeamDocument, FirebaseTeamDocument } from "./firebaseTypes";
import FirebasePlayerService from "./FirebasePlayerService";
import { toPlayerBasicDTO, toPlayerDirectoryBasicDTO, toTeamBasicDTO, toTeamWithPlayersDTO } from "./firebaseMappers";

const normalizeText = (value?: string): string => (value ?? "").trim().toLowerCase();

class FirebaseTeamService {
    public static async getTeamsWithPlayerNames(): Promise<TeamGetWithPlayerNamesDTO[]> {
        const user = await getFirebaseUser();
        const snapshot = await getDocs(query(getCollection<FirebaseTeamDocument>("teams"), where("ownerUid", "==", user.uid)));
        return Promise.all(snapshot.docs.map((teamDoc) => this.toTeamWithPlayers(teamDoc.data())));
    }

    public static async getTeamById(id: number): Promise<TeamGetBasicDTO> {
        const user = await getFirebaseUser();
        const team = await this.getTeamDocumentById(id, user.uid);
        return team ? toTeamBasicDTO(team) : Object.assign(new TeamGetBasicDTO(), { id: 0, name: "" });
    }

    public static async createTeam(team: TeamCreateDTO): Promise<TeamCreateDTO> {
        const user = await getFirebaseUser();
        const teamId = team.id || await nextNumericId("teams");
        const teamDocument: FirebaseTeamDocument = {
            id: teamId,
            ownerUid: user.uid,
            name: team.name ?? "New Team",
            memberPlayerIds: [],
        };

        const { db } = getRequiredFirebase();
        await setDoc(doc(db, "teams", `team-${teamId}`), teamDocument);
        return Object.assign(new TeamCreateDTO(), { id: teamDocument.id, name: teamDocument.name });
    }

    public static async searchTeams(searchText: string): Promise<TeamGetBasicDTO[]> {
        const teams = await this.getTeamsWithPlayerNames();
        const normalizedSearch = normalizeText(searchText);
        return teams
            .filter((team) => normalizeText(team.name).includes(normalizedSearch))
            .map((team) => Object.assign(new TeamGetBasicDTO(), { id: team.id, name: team.name }));
    }

    public static async searchPlayerTeams(inId: number, searchText: string): Promise<TeamGetWithPlayerNamesDTO[]> {
        const teams = await this.getTeamsWithPlayerNames();
        const normalizedSearch = normalizeText(searchText);
        return teams.filter((team) =>
            team.teamMembers?.some((member) => member.id === inId) &&
            normalizeText(team.name).includes(normalizedSearch)
        );
    }

    public static async getTeamsByPlayers(getTeamsByPlayers: GetTeamsByPlayerIdsDTO): Promise<TeamGetWithPlayerNamesDTO[]> {
        const teams = await this.getTeamsWithPlayerNames();
        const player1Id = getTeamsByPlayers.player1Id ?? 0;
        const player2Id = getTeamsByPlayers.player2Id ?? 0;
        return teams.filter((team) => {
            const memberIds = team.teamMembers?.map((member) => member.id) ?? [];
            return memberIds.includes(player1Id) &&
                (!player2Id || memberIds.includes(player2Id));
        });
    }

    public static async addPlayersToNewTeam(playerTeamCreate: PlayerTeamCreateDTO): Promise<TeamGetWithPlayerNamesDTO | undefined> {
        const user = await getFirebaseUser();
        const teamId = playerTeamCreate.teamId || await nextNumericId("teams");
        const memberPlayerIds = [playerTeamCreate.playerId1, playerTeamCreate.playerId2].filter((id): id is number => !!id);
        const teamDocument: FirebaseTeamDocument = {
            id: teamId,
            ownerUid: user.uid,
            name: playerTeamCreate.teamName || "New Team",
            memberPlayerIds,
        };

        const { db } = getRequiredFirebase();
        await setDoc(doc(db, "teams", `team-${teamId}`), teamDocument);
        return this.toTeamWithPlayers(teamDocument);
    }

    public static async getRoundsByTeamId(gameTeamId: number): Promise<GameRoundDTO[]> {
        const { default: FirebaseGameService } = await import("./FirebaseGameService");
        return FirebaseGameService.getRoundsByGameTeamId(gameTeamId);
    }

    public static async deletePreviousGamesForPlayerTeam(_playerId: number, _teamId: number): Promise<void> {
        throw new Error("Deleting previous Firebase games for a player/team is not implemented yet.");
    }

    public static async getTeamDocumentById(id: number, ownerUid?: string): Promise<FirebaseTeamDocument | undefined> {
        const userUid = ownerUid ?? (await getFirebaseUser()).uid;
        return (await getOwnedByNumericId<FirebaseTeamDocument>("teams", id, userUid))?.data;
    }

    public static async toTeamWithPlayers(team: FirebaseTeamDocument): Promise<TeamGetWithPlayerNamesDTO> {
        const players = await Promise.all(team.memberPlayerIds.map((playerId) => FirebasePlayerService.getPlayerDocumentById(playerId)));
        const teamMembers = players.filter(Boolean).map((player) => toPlayerBasicDTO(player!));
        return toTeamWithPlayersDTO(team, teamMembers);
    }

    public static async toSharedGameTeam(gameTeam: FirebaseGameTeamDocument): Promise<TeamGetWithPlayerNamesDTO> {
        const players = await Promise.all(
            gameTeam.memberPlayerIds.map((playerId) => FirebasePlayerService.getPublicPlayerById(playerId))
        );
        const teamMembers = players.filter(Boolean).map((player) => toPlayerDirectoryBasicDTO(player!));
        const inferredName = teamMembers
            .map((player) => player.nickName?.trim())
            .filter(Boolean)
            .join(" and ");
        const sharedTeam: FirebaseTeamDocument = {
            id: gameTeam.teamId,
            ownerUid: gameTeam.ownerUid,
            name: gameTeam.teamName?.trim() || inferredName || `Team ${gameTeam.teamId}`,
            memberPlayerIds: gameTeam.memberPlayerIds,
        };

        return toTeamWithPlayersDTO(sharedTeam, teamMembers);
    }
}

export default FirebaseTeamService;
