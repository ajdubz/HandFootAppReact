import GameAddDTO from "../models/DTOs/Game/GameAddDTO";
import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import PlayerFullDetailsDTO from "../models/DTOs/Player/PlayerFullDetailsDTO";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import PlayerTeamCreateDTO from "../models/DTOs/Team/PlayerTeamCreateDTO";
import TeamGetWithPlayerNamesDTO from "../models/DTOs/Team/TeamGetWithPlayerNamesDTO";
import PlayerService from "../services/PlayerService";
import TeamService from "../services/TeamService";
import GameService from "../services/GameService";
import GameWithRulesDTO from "../models/DTOs/Game/GameWithRulesDTO";
import Rules from "../models/Rules";
import { isApiErrorCode } from "../services/apiClient";
import {
    getPlayerPublicTag,
    normalizePlayerSearchText,
} from "../player/playerPublicId";

/**
 * Interface representing a custom row in the form.
 */
export interface CustomRow {
    search1: string;
    player1: PlayerGetBasicDTO | undefined;
    search2: string;
    player2: PlayerGetBasicDTO | undefined;
    teamName: TeamGetWithPlayerNamesDTO | undefined;
    teamSearch: string;
}

const normalizeName = (value: string | undefined) => (value ?? "").trim().toLowerCase();

const removeGuestSuffix = (value: string | undefined) => (value ?? "").trim().replace(/\s+\(guest\)$/i, "");

const namesMatch = (existingName: string | undefined, searchName: string) => {
    const normalizedSearch = normalizeName(searchName);
    const normalizedExisting = normalizeName(existingName);
    const normalizedWithoutGuestSuffix = normalizeName(removeGuestSuffix(existingName));

    return normalizedExisting === normalizedSearch || normalizedWithoutGuestSuffix === normalizedSearch;
}

const findMatchingPlayer = (players: PlayerGetBasicDTO[] | undefined, playerName: string) => {
    const normalizedSearch = normalizePlayerSearchText(playerName);
    const isTagSearch = normalizedSearch.startsWith("#");
    const normalizedTagSearch = isTagSearch ? normalizedSearch.slice(1) : "";
    return (players ?? []).find((player) =>
        namesMatch(player.nickName, playerName) ||
        namesMatch(player.fullName, playerName) ||
        (
            isTagSearch &&
            normalizePlayerSearchText(getPlayerPublicTag(player.id, player.publicTag)) === normalizedTagSearch
        )
    );
};

const toBasicPlayer = (player: PlayerGetBasicDTO | PlayerAccountDTO) => {
    const basicPlayer = new PlayerGetBasicDTO();
    basicPlayer.id = player.id;
    basicPlayer.nickName = player.nickName;
    basicPlayer.fullName = player.fullName;
    basicPlayer.publicTag = player.publicTag;
    return basicPlayer;
};

const resolveExistingPlayer = async (playerName: string): Promise<PlayerGetBasicDTO | undefined> => {
    const existingPlayers = await PlayerService.getPlayers().catch((error) => {
        console.error("Error loading existing players:", error);
        return [];
    });
    const matchedExistingPlayer = findMatchingPlayer(existingPlayers, playerName);

    if (matchedExistingPlayer?.id) {
        return toBasicPlayer(matchedExistingPlayer);
    }

    const searchResults = await PlayerService.searchPlayers(playerName).catch((error) => {
        console.error("Error searching existing players:", error);
        return [];
    });
    const matchedSearchedPlayer = findMatchingPlayer(searchResults, playerName);

    return matchedSearchedPlayer?.id ? toBasicPlayer(matchedSearchedPlayer) : undefined;
};

const isDuplicateAccountError = (error: unknown) => {
    return isApiErrorCode(error, "duplicate_player") ||
        (error instanceof Error && error.message.toLowerCase().includes("already exists"));
};

const buildGuestEmail = (playerName: string) => {
    const normalizedName = playerName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "guest";
    return `${normalizedName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@guest.local`;
};

/**
 * Validates the rows in the form.
 * @param inRows - Array of rows to validate.
 * @param playerCount - Number of players (1 or 2).
 * @returns An object containing error messages for each invalid field.
 */
export const performRowValidation = (inRows: CustomRow[], playerCount: number) => {
    const retErrors: { [key: string]: string } = {};

    if (inRows.length <= 1) {
        retErrors["teamSearch0"] = "At least two teams are required";
        return retErrors;
    }

    inRows.forEach((r, index) => {
        const tempErrors: { [key: string]: string } = {};

        if (!r.search1.trim()) {
            tempErrors[`search1${index}`] = "Player 1 is required";
        }

        if (playerCount === 2 && !r.search2.trim()) {
            tempErrors[`search2${index}`] = "Player 2 is required";
        }

        if (playerCount === 2 && r.player1?.id && r.player2?.id && r.player1.id === r.player2.id) {
            tempErrors[`search1${index}`] = "Players must be different";
            tempErrors[`search2${index}`] = "Players must be different";
        }

        Object.assign(retErrors, tempErrors);
    });

    return retErrors;
}

/**
 * Creates a new guest player and sets the player value in the row.
 * @param row - The row to update.
 * @param whichCol - The column number (1 or 2) to set the player.
 * @param setValue - Function to set the player value.
 */
export const setNewPlayer = async (row: CustomRow, whichCol: number, setValue: (player: PlayerGetBasicDTO) => void): Promise<PlayerGetBasicDTO | undefined> => {
    const playerName = (whichCol === 1 ? row.search1 : row.search2).trim();
    const matchedExistingPlayer = await resolveExistingPlayer(playerName);

    if (matchedExistingPlayer?.id) {
        setValue(matchedExistingPlayer);
        return matchedExistingPlayer;
    }

    const newPlayer = new PlayerAccountDTO();
    newPlayer.nickName = playerName + " (Guest)";
    newPlayer.fullName = playerName + " (Guest)";
    newPlayer.email = buildGuestEmail(playerName);
    newPlayer.password = "guest";

    return await PlayerService.createGuest(newPlayer)
        .then((data) => {
            let tempPlayer = toBasicPlayer(data);
            setValue(tempPlayer);
            return tempPlayer;
        })
        .catch(async (error) => {
            if (isDuplicateAccountError(error)) {
                const existingPlayer = await resolveExistingPlayer(playerName);
                if (existingPlayer?.id) {
                    setValue(existingPlayer);
                    return existingPlayer;
                }
            }

            console.error("Error in setNewPlayer:", error);
            throw error;
        });
}

/**
 * Creates a new team with the players in the row.
 * @param row - The row containing the players and team name.
 */
export const getDefaultTeamName = (row: CustomRow, playerCount: number) => {
    const player1Name = row.search1.trim() || removeGuestSuffix(row.player1?.nickName);
    const player2Name = row.search2.trim() || removeGuestSuffix(row.player2?.nickName);
    const names = playerCount === 2 ? [player1Name, player2Name] : [player1Name];

    return names.filter(Boolean).join(" and ");
}

export const setNewPlayerTeam = async (row: CustomRow, teamName: string) => {
    let newPlayerTeam = new PlayerTeamCreateDTO();
    newPlayerTeam.playerId1 = row.player1?.id ?? 0;
    newPlayerTeam.playerId2 = row.player2?.id ?? 0;
    newPlayerTeam.teamName = teamName;

    return await TeamService.addPlayersToNewTeam(newPlayerTeam);
}

/**
 * Creates a new game and sets the game value.
 * @param game - The game to create.
 * @param setValue - Function to set the game value.
 */
export const setNewGame = async (setValue: (game: GameWithRulesDTO) => void, rules?: Rules): Promise<GameWithRulesDTO> => {

    let game = new GameAddDTO();
    game.rules = rules;

    return await GameService.addGame(game)
        .then((data) => {
            setValue(data ?? new GameWithRulesDTO());
            return data ?? new GameWithRulesDTO();
        })
        .catch((error) => {
            console.error("Error in setNewGame:", error);
            throw error;
        });
}

export const addTeamToGame = async (gameId: number, teamId: number) => {
    try {
        await GameService.addTeamToGame(gameId, teamId);
    } catch (error) {
        console.error("Error in addTeamToGame:", error);
        throw error;
    }
}

/**
 * Retrieves the current player details by ID.
 * @param id - The ID of the player.
 * @param successFunc - Function to call on successful retrieval.
 * @param failFunc - Function to call on failure.
 */
export const getCurrentPlayer = async (id: number, successFunc: (data: PlayerFullDetailsDTO) => void, failFunc: () => void) => {
    await PlayerService.getPlayerFullDetailsById(id)
        .then((data) => {
            successFunc(data);
        })
        .catch((error) => {
            console.error("Error in getPlayerFullDetailsById:", error);
            failFunc();
        });
}

/**
 * Handles the selection of a player or team in the dropdown.
 * @param colNum - The column number (1, 2, or 3).
 * @param inRow - The row to update.
 * @param player - The selected player or team.
 * @param setRowFunc - Function to set the updated row.
 */
export const handlePlayerSelection = (colNum: number, inRow: CustomRow, player: PlayerGetBasicDTO | TeamGetWithPlayerNamesDTO | undefined, setRowFunc: (newRow: CustomRow) => void) => {
    if (colNum === 1 || colNum === 2) {
        inRow[`player${colNum}`] = player as PlayerGetBasicDTO;
        inRow[`search${colNum}`] = (player as PlayerGetBasicDTO)?.nickName ?? "";
    } else if (colNum === 3) {
        inRow.teamName = player as TeamGetWithPlayerNamesDTO;
        inRow.teamSearch = (player as TeamGetWithPlayerNamesDTO)?.name ?? "";
    } else {
        console.log("Invalid column number");
    }
    setRowFunc(inRow);
}
