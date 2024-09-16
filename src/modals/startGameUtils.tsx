import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import PlayerFullDetailsDTO from "../models/DTOs/Player/PlayerFullDetailsDTO";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import PlayerTeamCreateDTO from "../models/DTOs/Team/PlayerTeamCreateDTO";
import TeamGetWithPlayerNamesDTO from "../models/DTOs/Team/TeamGetWithPlayerNamesDTO";
import { performFriendSearch } from "../player/playerList";
import PlayerService from "../services/PlayerService";
import TeamService from "../services/TeamService";
import { performPlayerTeamSearch } from "../team/teamList";


export interface CustomRow {
    search1: string;
    player1: PlayerGetBasicDTO | undefined;
    search2: string;
    player2: PlayerGetBasicDTO | undefined;
    teamName: TeamGetWithPlayerNamesDTO | undefined;
    teamSearch: string;
}

export const performRowValidation = (inRows: CustomRow[], playerCount: number) => {

    const retErrors: { [key: string]: string } = {};

    if(inRows.length <= 1) {
        retErrors["teamSearch0"] = "At least two teams are required";
        return;
    }

    inRows.forEach((r, index) => {
        const tempErrors: { [key: string]: string } = {};

        if(!r.search1.trim()) {
            // alert("Player 1 is required");
            tempErrors[`search1${index}`] = "Player 1 is required";
        }

        if(playerCount == 2 && !r.search2.trim()) {
            // alert("Player 2 is required");
            tempErrors[`search2${index}`] = "Player 2 is required";
        }

        if (!r.teamSearch.trim()) {
            tempErrors[`teamSearch${index}`] = "Team name is required";
            // alert("Team name is required");
        }

        if(r.player1 && r.player2 && r.player1.id === r.player2.id) {
            // alert("Players must be different");
            tempErrors[`search1${index}`] = "Players must be different";
            tempErrors[`search2${index}`] = "Players must be different";
        }

        Object.assign(retErrors, tempErrors);
    });

    return retErrors;
}

export const setNewPlayer = async (row: CustomRow, whichCol: number, setValue: (player: PlayerGetBasicDTO) => void) => {
    let newPlayer = new PlayerAccountDTO();
    let playerName = whichCol == 1 ? row.search1 : row.search2;
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

export const setNewPlayerTeam = async (row: CustomRow) => {
    let newPlayerTeam = new PlayerTeamCreateDTO();
    newPlayerTeam.playerId1 = row.player1?.id ?? 0;
    newPlayerTeam.playerId2 = row.player2?.id ?? 0;
    newPlayerTeam.teamName = row.teamSearch ?? "";

    await TeamService.addPlayersToNewTeam(newPlayerTeam);
}

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

export const handlePlayerSelection = (colNum: number, inRow: CustomRow, player: PlayerGetBasicDTO | TeamGetWithPlayerNamesDTO | undefined, setRowFunc: (newRow: CustomRow) => void) => {

    if (colNum == 1 || colNum == 2) {
        inRow[`player${colNum}`] = player as PlayerGetBasicDTO;
        inRow[`search${colNum}`] = (player as PlayerGetBasicDTO)?.nickName ?? "";
    }
    else if (colNum == 3) {
        inRow.teamName = player as TeamGetWithPlayerNamesDTO;
        inRow.teamSearch = (player as TeamGetWithPlayerNamesDTO)?.name ?? "";
    }
    else {
        console.log("Invalid column number");
    }
    setRowFunc(inRow);
}