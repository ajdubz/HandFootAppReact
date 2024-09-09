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
import { ListTeams, performTeamSearch, performTeamByPlayerSearch } from "../team/teamList";
import TeamCreateDTO from "../models/DTOs/Team/TeamCreateDTO";
import TeamService from "../services/TeamService";
import TeamGetBasicDTO from "../models/DTOs/Team/TeamGetBasicDTO";
import GetTeamsByPlayerIdsDTO from "../models/DTOs/Team/GetTeamsByPlayerIdsDTO";
import PlayerFullDetailsDTO from "../models/DTOs/Player/PlayerFullDetailsDTO";

interface StartGameProps {
    id: number;
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

interface Row {
    player1: string;
    player2: string;
    teamName: string;
}

function StartGame({ id, isOpen, onCancel, onConfirm }: StartGameProps) {
    const [searchPlayersResults, setSearchPlayersResults] = useState<PlayerGetBasicDTO[] | undefined>([]);
    const [searchPlayer2Results, setSearchPlayer2Results] = useState<PlayerGetBasicDTO[] | undefined>([]);
    const [searchTeamResults, setSearchTeamResults] = useState<TeamGetBasicDTO[] | undefined>([]);
    const [searchTeamsByPlayersResults, setSearchTeamsByPlayersResults] = useState<TeamGetBasicDTO[] | undefined>([]);
    const [showFriendListOne, setShowFriendListOne] = useState<boolean>(false);
    const [showFriendListTwo, setShowFriendListTwo] = useState<boolean>(false);
    const [showTeamList, setShowTeamList] = useState<boolean>(false);
    const [rows, setRows] = useState<Row[]>([{ player1: "", player2: "", teamName: "" }]);
    const [activeRowIndex, setActiveRowIndex] = useState<number>(0);
    const [playerCount, setPlayerCount] = useState<number>(2); // Default to 2 players

    useEffect(() => {
        if (isOpen) {
            setRows([{ player1: "", player2: "", teamName: "" }]);
            setSearchPlayersResults([]);
            setSearchPlayer2Results([]);
            setSearchTeamResults([]);
            setSearchTeamsByPlayersResults([]);
            setShowFriendListOne(false);
            setShowFriendListTwo(false);
            setShowTeamList(false);
            setActiveRowIndex(0);
        }
    }, []);


    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        rows.forEach(row => {

            // const team = searchTeamResults?.find(team => team.name === row.teamName);
            const player1 = searchPlayersResults?.find(player => player.nickName === row.player1);
            const player2 = searchPlayer2Results?.find(player => player.nickName === row.player2);

            if (!player1) {
                let playerDTO = new Player();
                playerDTO.nickName = row.player1;
                // Create player
                PlayerService.createPlayer(playerDTO)
                    .then(() => {
                        console.log("Player created:", playerDTO);
                    })
                    .catch((error) => {
                        console.error("Error in createPlayer:", error);
                    });
            }

            if (playerCount == 2 && !player2) {
                let playerDTO = new Player();
                playerDTO.nickName = row.player2;
                // Create player
                PlayerService.createPlayer(playerDTO)
                    .then(() => {
                        console.log("Player created:", playerDTO);
                    })
                    .catch((error) => {
                        console.error("Error in createPlayer:", error);
                    });
            }

            let getTeamsWithPlayers = new GetTeamsByPlayerIdsDTO();
            getTeamsWithPlayers.player1Id = player1?.id ?? 0;
            getTeamsWithPlayers.player2Id = player2?.id ?? 0;

            performTeamByPlayerSearch(getTeamsWithPlayers, setSearchTeamsByPlayersResults);


            if (!searchTeamsByPlayersResults || searchTeamsByPlayersResults.length == 0) {
                let teamDTO = new TeamCreateDTO();
                teamDTO.name = row.teamName;
                // Create team
                TeamService.createTeam(teamDTO)
                    .then((newTeam) => {
                        console.log("Team created:", newTeam);

                        //create the PlayerTeam records


                    })
                    .catch((error) => {
                        console.error("Error in createTeam:", error);
                    });

            }



        });

        onConfirm();
    };


    const handleCancel = () => {
        setRows([{ player1: "", player2: "", teamName: "" }]);
        setSearchPlayersResults([]);
        setSearchPlayer2Results([]);
        setSearchTeamResults([]);
        setShowFriendListOne(false);
        setShowFriendListTwo(false);
        setShowTeamList(false);
        setActiveRowIndex(0);

        onCancel();
    };


    const handleInputChange = (index: number, field: keyof Row, value: string) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);

        //need to add the current player to the search results

        if (field === "player1") {
            performFriendSearch(id, value, setSearchPlayersResults);
            setShowFriendListOne(true);

        } else if (field === "player2") {
            performFriendSearch(id, value, setSearchPlayer2Results);
            setShowFriendListTwo(true);
        }
        else if (field === "teamName") {
            performTeamSearch(id, value, setSearchTeamResults);
            setShowTeamList(true);
        }

    };



    const renderTableRows = () => {
        return rows.map((row, index) => (
            <tr key={index}>
                <td>
                    {renderTableRowControl(index, "player1")}
                </td>
                <td>
                    {playerCount == 2 && renderTableRowControl(index, "player2")}
                </td>
                <td>
                    {renderTableRowControl(index, "teamName")}
                </td>
                <td>
                    <Button variant="outline-danger" onClick={() => setRows(rows.filter((r, i) => i !== index))} >
                        Remove
                    </Button>
                </td>
            </tr>
        ));
    };



    const renderTableRowControl = (index: number, field: keyof Row) => {
        const column = field as string;
        const colNum = parseInt(column[column.length - 1]);
        const isPlayerField = !isNaN(colNum) && colNum >= 1 && colNum <= 2;
        const searchResults = isPlayerField ? (colNum == 1 ? searchPlayersResults : searchPlayer2Results) : searchTeamResults;
        const showList = isPlayerField ? (colNum == 1 ? showFriendListOne : showFriendListTwo) : showTeamList;
        const setShowList = isPlayerField ? (colNum == 1 ? setShowFriendListOne : setShowFriendListTwo) : setShowTeamList;
    
        return (
            <Dropdown show={activeRowIndex == index && showList && searchResults != null} autoClose>
                <FormControl
                    autoFocus
                    placeholder={isPlayerField ? `Search Player ${colNum} Name` : `Search Team Name`}
                    value={rows[index][field]}
                    onFocus={(e) => setActiveRowIndex(index)}
                    onChange={(e) => handleInputChange(index, field, e.target.value)}
                    className="form-control-outline"
                />
                <DropdownMenu>
                    {ListFriends(searchResults, (player) => { handleInputChange(index, field, player?.nickName ?? ""); setShowList(false); })}
                    {ListTeams(searchResults, (Team) => { handleInputChange(index, field, Team?.name ?? ""); setShowList(false); })}
                </DropdownMenu>
            </Dropdown>
        );
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
                    <Button variant="outline-primary" onClick={() => setRows([...rows, { player1: "", player2: "", teamName: "" }])}>
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
