import React, { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import "./startGame.css";
import "../App.css";
import { ListFriends, performFriendSearch } from "../player/playerList";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import Player from "../models/Player";
import PlayerService from "../services/PlayerService";
import FriendService from "../services/FriendService";
import Dropdown from "react-bootstrap/Dropdown";
import FormControl from "react-bootstrap/FormControl";
import { Form } from "react-router-dom";
import { DropdownItem, DropdownMenu } from "react-bootstrap";
import { ListTeams, performTeamSearch, getTeamsByPlayerTeams, performPlayerTeamSearch } from "../team/teamList";
import TeamCreateDTO from "../models/DTOs/Team/TeamCreateDTO";
import TeamService from "../services/TeamService";
import TeamGetBasicDTO from "../models/DTOs/Team/TeamGetBasicDTO";
import GetTeamsByPlayerIdsDTO from "../models/DTOs/Team/GetTeamsByPlayerIdsDTO";
import PlayerFullDetailsDTO from "../models/DTOs/Player/PlayerFullDetailsDTO";
import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import PlayerTeamDTO from "../models/DTOs/Team/PlayerTeamDTO";
import PlayerTeamCreateDTO from "../models/DTOs/Team/PlayerTeamCreateDTO";
import TeamGetWithPlayerNamesDTO from "../models/DTOs/Team/TeamGetWithPlayerNamesDTO";

interface StartGameProps {
    id: number;
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

interface Row {
    playerSearch1: string;
    player1: PlayerGetBasicDTO | undefined;
    playerSearch2: string;
    player2: PlayerGetBasicDTO | undefined;
    teamName: TeamGetWithPlayerNamesDTO | undefined;
    teamSearch: string;
}

function StartGame({ id, isOpen, onCancel, onConfirm }: StartGameProps) {
    const [currentPlayer, setCurrentPlayer] = useState<PlayerFullDetailsDTO | undefined>(undefined);
    const [searchPlayersResults, setSearchPlayersResults] = useState<PlayerGetBasicDTO[] | undefined>([]);
    const [searchPlayer2Results, setSearchPlayer2Results] = useState<PlayerGetBasicDTO[] | undefined>([]);
    const [searchTeamResults, setSearchTeamResults] = useState<TeamGetWithPlayerNamesDTO[] | undefined>([]);
    const [searchTeamsByPlayersResults, setSearchTeamsByPlayersResults] = useState<TeamGetWithPlayerNamesDTO[] | undefined>([]);
    const [showFriendListOne, setShowFriendListOne] = useState<boolean>(false);
    const [showFriendListTwo, setShowFriendListTwo] = useState<boolean>(false);
    const [showTeamList, setShowTeamList] = useState<boolean>(false);
    const [rows, setRows] = useState<Row[]>([{ playerSearch1: currentPlayer?.nickName ?? "", player1: currentPlayer, playerSearch2: "", player2: new PlayerGetBasicDTO(), teamName: new TeamGetWithPlayerNamesDTO(), teamSearch: "" }]);
    const [activeRowIndex, setActiveRowIndex] = useState<number>(0);
    const [playerCount, setPlayerCount] = useState<number>(2); // Default to 2 players
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        getCurrentPlayer();
    }, [isOpen]);

    const getCurrentPlayer = async () => {
        await PlayerService.getPlayerFullDetailsById(id)
            .then((data) => {
                setCurrentPlayer(data);
                clearItems();
            })
            .catch((error) => {
                console.error("Error in getPlayerFullDetailsById:", error);
                setCurrentPlayer(new PlayerFullDetailsDTO());
            });
    }

    // const setNewTeam = async (row: Row) => {
    //     let newTeam = new TeamCreateDTO();
    //     newTeam.name = row.teamSearch;
        
    //     await TeamService.createTeam(newTeam)
    //         .then((data) => {
    //             alert("Team created successfully" + data.id);
    //             row.teamName = data;
    //             setNewPlayerTeam(row);
    //             // return row;
    //         })
    //         .catch((error) => {
    //             console.error("Error in setNewTeam:", error);
    //             // return row;
    //         }
    //     );

    // }

    const setNewPlayerTeam = async (row: Row) => {
        let newPlayerTeam = new PlayerTeamCreateDTO();
        newPlayerTeam.playerId1 = row.player1?.id ?? 0;
        newPlayerTeam.playerId2 = row.player2?.id ?? 0;
        newPlayerTeam.teamName = row.teamSearch ?? "";

        await TeamService.addPlayersToNewTeam(newPlayerTeam)
            .then(() => {
                // alert("Players added to team successfully");
            })
            .catch((error) => {
                // alert("Error in setNewPlayerTeam:" + error);
            }
        );
    }

    const setNewPlayer = async (row: Row, whichCol: number, setValue: (player: PlayerGetBasicDTO) => void) => {
        let newPlayer = new PlayerAccountDTO();
        let playerName = whichCol == 1 ? row.playerSearch1 : row.playerSearch2;
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

    const clearItems = () => {
        setSearchPlayersResults([]);
        setSearchPlayer2Results([]);
        setSearchTeamResults([]);
        setSearchTeamsByPlayersResults([]);
        setErrors({});

        setShowFriendListOne(false);
        setShowFriendListTwo(false);
        setShowTeamList(false);
        setActiveRowIndex(0);

        setRows([{ playerSearch1: currentPlayer?.nickName ?? "", player1: currentPlayer, playerSearch2: "", player2: new PlayerGetBasicDTO(), teamName: new TeamGetBasicDTO(), teamSearch: "" }]);
    }

    const handleRowValidation = (row: Row) => {
        const tempErrors: { [key: string]: string } = {};

        if(!row.playerSearch1.trim()) {
            // alert("Player 1 is required");
            tempErrors[`playerSearch1${rows.indexOf(row)}`] = "Player 1 is required";
        }

        if(playerCount == 2 && !row.playerSearch2.trim()) {
            // alert("Player 2 is required");
            tempErrors[`playerSearch2${rows.indexOf(row)}`] = "Player 2 is required";
        }

        if (!row.teamSearch.trim()) {
            tempErrors[`teamSearch${rows.indexOf(row)}`] = "Team name is required";
            // alert("Team name is required");
        }

        if(row.player1 && row.player2 && row.player1.id === row.player2.id) {
            // alert("Players must be different");
            tempErrors[`playerSearch1${rows.indexOf(row)}`] = "Players must be different";
            tempErrors[`playerSearch2${rows.indexOf(row)}`] = "Players must be different";
        }

        return tempErrors;
    }



    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setErrors({});


        const newErrors: { [key: string]: string } = {};

        if(rows.length <= 1) {
            newErrors["teamSearch0"] = "At least two teams are required";
            setErrors(newErrors);
            return;
        }

        rows.forEach(row => {

            const tempErrors = handleRowValidation(row);
            Object.assign(newErrors, tempErrors);
            if (Object.keys(tempErrors).length > 0) {
                return;
            }

            if(!row.player1 && row.playerSearch1.trim()) {
                alert("Player 1 does not exist");
                setNewPlayer(row, 1, (tempPlayer1) => {row.player1 = tempPlayer1});
            }

            if(!row.player2 && row.playerSearch2.trim() && playerCount == 2) {
                alert("Player 2 does not exist");
                setNewPlayer(row, 2, (tempPlayer2) => {row.player2 = tempPlayer2});
            }

            let tempTeam = new GetTeamsByPlayerIdsDTO();
            tempTeam.player1Id = row.player1?.id ?? 0;
            tempTeam.player2Id = row.player2?.id ?? 0;

            getTeamsByPlayerTeams(tempTeam, setSearchTeamsByPlayersResults);

            if(searchTeamsByPlayersResults && searchTeamsByPlayersResults.length > 0) {

                if(searchTeamsByPlayersResults.some(team => team === row.teamName)) {
                    alert("Team already exists");
                    //this is where I'll add the team to the game
                    return;
                }
                else {
                    alert("Some do, but this Team does not exist");
                    setNewPlayerTeam(row);
                    // setNewTeam(row);
                }
            }
            else {
                console.log("Team does not exist");
                setNewPlayerTeam(row);
                    // setNewTeam(row);
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        alert("Game started successfully");

        onConfirm();
    };


    const handleCancel = () => {
        clearItems();

        onCancel();
    };


    const handleInputChange = (index: number, field: keyof Row, value: string) => {
        const newRows = [...rows];
        newRows[index][field] = value;

        if (field === "playerSearch1") {
            newRows[index].player1 = new PlayerGetBasicDTO();
            performFriendSearch(id, value, setSearchPlayersResults);
            setShowFriendListOne(true);

        } else if (field === "playerSearch2") {
            newRows[index].player2 = new PlayerGetBasicDTO();
            performFriendSearch(id, value, setSearchPlayer2Results);
            setShowFriendListTwo(true);
        }
        else if (field === "teamSearch") {
            newRows[index].teamName = new TeamGetWithPlayerNamesDTO();
            // performTeamSearch(value, setSearchTeamResults);
            performPlayerTeamSearch(id, value, setSearchTeamResults);
            setShowTeamList(true);
        }


        setRows(newRows);

    };

    const handlePlayerSelection = (player: PlayerGetBasicDTO | undefined) => {
        const newRows = [...rows];
        newRows[activeRowIndex].player1 = player;
        newRows[activeRowIndex].playerSearch1 = player?.nickName ?? "";

        setRows(newRows);
    }

    const handlePlayer2Selection = (player: PlayerGetBasicDTO | undefined) => {
        const newRows = [...rows];
        newRows[activeRowIndex].player2 = player;
        newRows[activeRowIndex].playerSearch2 = player?.nickName ?? "";
        setRows(newRows);
    }

    const handleTeamSelection = (team: TeamGetWithPlayerNamesDTO | undefined) => {
        const newRows = [...rows];
        newRows[activeRowIndex].teamName = team;
        newRows[activeRowIndex].teamSearch = team?.name ?? "";
        setRows(newRows);
    }


    const renderTableRowControl = (index: number, field: keyof Row) => {
        const column = field as string;
        const colNum = column === "playerSearch1" ? 1 : column === "playerSearch2" ? 2 : 3;
        const isPlayerField = colNum && colNum >= 1 && colNum <= 2;
        const searchResults = isPlayerField ? (colNum == 1 ? searchPlayersResults : searchPlayer2Results) : searchTeamResults;
        const showList = isPlayerField ? (colNum == 1 ? showFriendListOne : showFriendListTwo) : showTeamList;
        const errorKey = `${field}${index}`;
        const errorMessage = errors[errorKey];

        const setShowList = isPlayerField ? (colNum == 1 ? setShowFriendListOne : setShowFriendListTwo) : setShowTeamList;
        const setSelection = isPlayerField ? (colNum == 1 ? handlePlayerSelection : handlePlayer2Selection) : handleTeamSelection;
        const list = isPlayerField ? ListFriends : ListTeams;
    
        
        return (
            <Dropdown show={activeRowIndex == index && showList && searchResults != null} autoClose>
                <FormControl
                    autoFocus
                    placeholder={isPlayerField ? `Search Player ${colNum} Name` : `Search Team Name`}
                    value={rows[index][field] as string}
                    onFocus={(e) => setActiveRowIndex(index)}
                    onChange={(e) => handleInputChange(index, field, e.target.value)}
                    className={`form-control-outline ${errorMessage ? 'is-invalid' : ''}`}
                    disabled={isPlayerField && colNum == 1 && index == 1 && rows[index].player1 == currentPlayer}
                />
                {errorMessage && <div className="invalid-feedback">{errorMessage}</div>}
                <DropdownMenu>
                    {list(searchResults, (playerOrTeam) => { setSelection(playerOrTeam); setShowList(false); })}
                </DropdownMenu>
            </Dropdown>
        );
    };



    const renderTableRows = () => {
        return rows.map((row, index) => (
            <tr key={index}>
                <td>
                    {renderTableRowControl(index, "playerSearch1")}
                </td>
                <td>
                    {playerCount == 2 && renderTableRowControl(index, "playerSearch2")}
                </td>
                <td>
                    {renderTableRowControl(index, "teamSearch")}
                </td>
                <td>
                    <Button variant="outline-danger" onClick={() => setRows(rows.filter((r, i) => i !== index))} >
                        Remove
                    </Button>
                </td>
            </tr>
        ));
    };

    const renderPlayerRadioSelection = () => {
        return (
        <div>
            <div className="form-check form-check-inline">
                <input className="form-check-input" type="radio" name="playerCount" id="onePlayer" value="1" checked={playerCount === 1} onChange={() => setPlayerCount(1)} />
                <label className="form-check-label" htmlFor="onePlayer">
                    1 Player
                </label>
            </div>
            <div className="form-check form-check-inline">
                <input className="form-check-input" type="radio" name="playerCount" id="twoPlayers" value="2" checked={playerCount === 2} onChange={() => setPlayerCount(2)} />
                <label className="form-check-label" htmlFor="twoPlayers">
                    2 Players
                </label>
            </div>
        </div>
        );
    }




    return (
        <Modal show={isOpen} onHide={onCancel} centered size="lg">
            <form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>Start Game</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {renderPlayerRadioSelection()}
                    <br />
                    <h5>Enter team details:</h5>
                    <table className="tableClass">
                        <thead>
                            <tr>
                                <th>Player 1</th>
                                <th>{playerCount == 2 && "Player 2"}</th>
                                <th>Team Name</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderTableRows()}
                        </tbody>
                    </table>
                    <br />
                    <Button variant="outline-primary" onClick={() => setRows([...rows, { playerSearch1: "", player1: new PlayerGetBasicDTO(), playerSearch2: "", player2: new PlayerGetBasicDTO(), teamName: new TeamGetBasicDTO(), teamSearch: "" }])}>
                        Add New Team
                    </Button>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="primary" type="submit">
                        Continue
                    </Button>
                    <Button variant="secondary" onClick={handleCancel}>
                        Cancel
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}

export default StartGame;
