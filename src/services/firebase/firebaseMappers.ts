import GameAddDTO from "../../models/DTOs/Game/GameAddDTO";
import GameRoundDTO from "../../models/DTOs/Game/GameRoundDTO";
import GameTeamDTO from "../../models/DTOs/Game/GameTeamDTO";
import GameWithRulesDTO from "../../models/DTOs/Game/GameWithRulesDTO";
import PlayerAccountDTO from "../../models/DTOs/Player/PlayerAccountDTO";
import PlayerGetBasicDTO from "../../models/DTOs/Player/PlayerGetBasicDTO";
import TeamGetBasicDTO from "../../models/DTOs/Team/TeamGetBasicDTO";
import TeamGetWithPlayerNamesDTO from "../../models/DTOs/Team/TeamGetWithPlayerNamesDTO";
import { normalizeRules } from "../../rules/rulesDefaults";
import {
    FirebaseGameDocument,
    FirebaseGameRoundDocument,
    FirebaseGameTeamDocument,
    FirebasePlayerDocument,
    FirebaseTeamDocument,
} from "./firebaseTypes";

const toDate = (value: unknown): Date => {
    if (value instanceof Date) {
        return value;
    }

    if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
        return value.toDate();
    }

    if (typeof value === "string" || typeof value === "number") {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
            return date;
        }
    }

    return new Date();
};

export const toPlayerAccountDTO = (player: FirebasePlayerDocument): PlayerAccountDTO => Object.assign(new PlayerAccountDTO(), {
    id: player.id,
    nickName: player.nickName ?? "",
    fullName: player.fullName ?? "",
    email: player.email ?? "",
    password: "",
});

export const toPlayerBasicDTO = (player: FirebasePlayerDocument): PlayerGetBasicDTO => Object.assign(new PlayerGetBasicDTO(), {
    id: player.id,
    nickName: player.nickName ?? "",
    fullName: player.fullName ?? "",
});

export const toTeamBasicDTO = (team: FirebaseTeamDocument): TeamGetBasicDTO => Object.assign(new TeamGetBasicDTO(), {
    id: team.id,
    name: team.name ?? "",
});

export const toTeamWithPlayersDTO = (
    team: FirebaseTeamDocument,
    teamMembers: PlayerGetBasicDTO[] = [],
): TeamGetWithPlayerNamesDTO => Object.assign(new TeamGetWithPlayerNamesDTO(), {
    id: team.id,
    name: team.name ?? "",
    teamMembers,
});

export const toGameWithRulesDTO = (game: FirebaseGameDocument): GameWithRulesDTO => Object.assign(new GameWithRulesDTO(), {
    id: game.id,
    date: toDate(game.date),
    rules: normalizeRules(game.rules),
});

export const toGameAddDTO = (game: FirebaseGameDocument): GameAddDTO => Object.assign(new GameAddDTO(), {
    id: game.id,
    date: toDate(game.date),
    rules: normalizeRules(game.rules),
});

export const toGameTeamDTO = (
    gameTeam: FirebaseGameTeamDocument,
    game: FirebaseGameDocument,
    team: TeamGetWithPlayerNamesDTO,
): GameTeamDTO => Object.assign(new GameTeamDTO(), {
    id: gameTeam.id,
    game: toGameAddDTO(game),
    team,
});

export const toGameRoundDTO = (
    round: FirebaseGameRoundDocument,
    gameTeam: GameTeamDTO,
): GameRoundDTO => Object.assign(new GameRoundDTO(), {
    id: round.id,
    gameTeam,
    roundNumber: round.roundNumber ?? 0,
    cardPoints: round.cardPoints ?? 0,
    handScore: round.handScore ?? 0,
    cleanBooks: round.cleanBooks ?? 0,
    dirtyBooks: round.dirtyBooks ?? 0,
    redThrees: round.redThrees ?? 0,
    pulledCorrect: round.pulledCorrect ?? 0,
    isWinner: round.isWinner ?? false,
});
