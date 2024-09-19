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

        if (!r.teamSearch.trim()) {
            tempErrors[`teamSearch${index}`] = "Team name is required";
        }

        if (r.player1 && r.player2 && r.player1.id === r.player2.id) {
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
export const setNewPlayer = async (row: CustomRow, whichCol: number, setValue: (player: PlayerGetBasicDTO) => void) => {
    let newPlayer = new PlayerAccountDTO();
    let playerName = whichCol === 1 ? row.search1 : row.search2;
    newPlayer.nickName = playerName + " (Guest)";
    newPlayer.fullName = playerName + " (Guest)";

    await PlayerService.createGuest(newPlayer)
        .then((data) => {
            alert("Player created successfully");

            let tempPlayer = new PlayerGetBasicDTO();
            tempPlayer.id = data.id;
            tempPlayer.nickName = data.nickName;
            tempPlayer.fullName = data.fullName;
            setValue(tempPlayer);
        })
        .catch((error) => {
            console.error("Error in setNewPlayer:", error);
            return new PlayerGetBasicDTO();
        });
}

/**
 * Creates a new team with the players in the row.
 * @param row - The row containing the players and team name.
 */
export const setNewPlayerTeam = async (row: CustomRow) => {
    let newPlayerTeam = new PlayerTeamCreateDTO();
    newPlayerTeam.playerId1 = row.player1?.id ?? 0;
    newPlayerTeam.playerId2 = row.player2?.id ?? 0;
    newPlayerTeam.teamName = row.teamSearch ?? "";

    await TeamService.addPlayersToNewTeam(newPlayerTeam);
}

/**
 * Creates a new game and sets the game value.
 * @param game - The game to create.
 * @param setValue - Function to set the game value.
 */
export const setNewGame = async (setValue: (game: GameWithRulesDTO) => void): Promise<GameWithRulesDTO> => {

    let game = new GameAddDTO();

    return await GameService.addGame(game)
        .then((data) => {
            console.log(data?.id);
            setValue(data ?? new GameWithRulesDTO());
            return data ?? new GameWithRulesDTO();
        })
        .catch((error) => {
            console.error("Error in setNewGame:", error);
            return new GameWithRulesDTO();
        });
}

export const addTeamToGame = async (gameId: number, teamId: number) => {
    await GameService.addTeamToGame(gameId, teamId)
        .then(() => {
            console.log("Team added to game successfully");
        })
        .catch((error) => {
            console.error("Error in addTeamToGame:", error);
        });
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