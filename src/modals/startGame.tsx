import React, { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import "./startGame.css";
import "../App.css";
import { ListFriends, performFriendSearch } from "../player/playerList";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import Dropdown from "react-bootstrap/Dropdown";
import FormControl from "react-bootstrap/FormControl";
import { DropdownItem, DropdownMenu } from "react-bootstrap";
import { ListTeams, performTeamSearch, getTeamsByPlayerTeams, performPlayerTeamSearch } from "../team/teamList";
import TeamGetBasicDTO from "../models/DTOs/Team/TeamGetBasicDTO";
import GetTeamsByPlayerIdsDTO from "../models/DTOs/Team/GetTeamsByPlayerIdsDTO";
import PlayerFullDetailsDTO from "../models/DTOs/Player/PlayerFullDetailsDTO";
import TeamGetWithPlayerNamesDTO from "../models/DTOs/Team/TeamGetWithPlayerNamesDTO";
import { performRowValidation, CustomRow, setNewPlayer, setNewPlayerTeam, getCurrentPlayer, handlePlayerSelection } from "./startGameUtils";

// Interface for component props
interface StartGameProps {
    id: number;
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

// Main component function
function StartGame({ id, isOpen, onCancel, onConfirm }: StartGameProps) {
    // State variables
    const [currentPlayer, setCurrentPlayer] = useState<PlayerFullDetailsDTO | undefined>(undefined);
    const [searchResults, setSearchResults] = useState<{ players1: PlayerGetBasicDTO[] | undefined, players2: PlayerGetBasicDTO[] | undefined, teams: TeamGetWithPlayerNamesDTO[] | undefined }>({ players1: [], players2: [], teams: [] });
    const [searchTeamsByPlayersResults, setSearchTeamsByPlayersResults] = useState<TeamGetWithPlayerNamesDTO[] | undefined>([]);
    const [rows, setRows] = useState<CustomRow[]>([{ search1: currentPlayer?.nickName ?? "", player1: currentPlayer, search2: "", player2: new PlayerGetBasicDTO(), teamName: new TeamGetWithPlayerNamesDTO(), teamSearch: "" }]);
    const [activeCell, setActiveCell] = useState<number[]>([0, 0]);
    const [playerCount, setPlayerCount] = useState<number>(2); // Default to 2 players
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Effect to clear items and get current player when modal is opened
    useEffect(() => {
        clearItems();
        getCurrentPlayer(id, (data) => {setCurrentPlayer(data);}, () => {setCurrentPlayer(new PlayerFullDetailsDTO());});
    }, [isOpen]);

    // Function to clear search results and errors, and reset rows
    const clearItems = () => {
        setSearchResults({ players1: [], players2: [], teams: [] });
        setSearchTeamsByPlayersResults([]);
        setErrors({});
        setRows([{ search1: currentPlayer?.nickName ?? "", player1: currentPlayer, search2: "", player2: new PlayerGetBasicDTO(), teamName: new TeamGetBasicDTO(), teamSearch: "" }]);
    }

    // Function to handle form submission
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setErrors({});
        const newErrors: { [key: string]: string } = {};
        const tempErrors = performRowValidation(rows, playerCount);

        Object.assign(newErrors, tempErrors);

        if(Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        rows.forEach(row => {
            if(!row.player1 && row.search1.trim()) {
                alert("Player 1 does not exist");
                setNewPlayer(row, 1, (tempPlayer1) => {row.player1 = tempPlayer1});
            }

            if(!row.player2 && row.search2.trim() && playerCount == 2) {
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
                    // This is where I'll add the team to the game
                    return;
                } else {
                    alert("Some do, but this Team does not exist");
                    setNewPlayerTeam(row);
                }
            } else {
                console.log("Team does not exist");
                setNewPlayerTeam(row);
            }
        });

        alert("Game started successfully");
        onConfirm();
    };

    // Function to handle input changes in the form
    const handleInputChange = (index: number, field: keyof CustomRow, value: string) => {
        const newRows = [...rows];
        newRows[index][field] = value;

        if (field === "search1") {
            newRows[index].player1 = new PlayerGetBasicDTO();
            performFriendSearch(id, value, (players) => setSearchResults({ ...searchResults, players1: players }));
        } else if (field === "search2") {
            newRows[index].player2 = new PlayerGetBasicDTO();
            performFriendSearch(id, value, (players) => setSearchResults({ ...searchResults, players2: players }));
        } else if (field === "teamSearch") {
            newRows[index].teamName = new TeamGetWithPlayerNamesDTO();
            performPlayerTeamSearch(id, value, (teams) => setSearchResults({ ...searchResults, teams }));
        }

        setRows(newRows);
    };

    // Helper function to get column number based on field name
    const getColumnNumber = (field: string) => {
        if (field === "search1") return 1;
        if (field === "search2") return 2;
        return 3;
    };

    // Helper function to get search results based on column number
    const getSearchResults = (colNum: number) => {
        if (colNum === 1) return searchResults.players1;
        if (colNum === 2) return searchResults.players2;
        return searchResults.teams;
    };

    // Function to render table row controls
    const renderTableRowControl = (index: number, field: keyof CustomRow) => {
        const column = field as string;
        const colNum = getColumnNumber(column);
        const isPlayer = colNum >= 1 && colNum <= 2;
        const searchResults = getSearchResults(colNum);
        const list = colNum == 3 ? ListTeams : ListFriends;
        const errorKey = `${field}${index}`;
        const errorMessage = errors[errorKey];
        const currentCell = activeCell[0] === index && activeCell[1] === colNum;
        const hasValue = rows[index][field] as string;

        return (
            <Dropdown show={hasValue != "" && searchResults?.length != 0 && currentCell} autoClose>
                <FormControl
                    autoFocus
                    placeholder={isPlayer ? `Search Player ${colNum} Name` : `Search Team Name`}
                    value={hasValue}
                    onFocus={() => setActiveCell([index, colNum])}
                    onChange={(e) => handleInputChange(index, field, e.target.value)}
                    className={`form-control-outline ${errorMessage ? "is-invalid" : ""}`}
                    disabled={isPlayer && colNum == 1 && index == 0 && rows[index].player1?.nickName == currentPlayer?.nickName}
                />
                {errorMessage && <div className="invalid-feedback">{errorMessage}</div>}
                <DropdownMenu>
                    {list(searchResults, (playerOrTeam) => {
                        handlePlayerSelection(colNum, rows[index], playerOrTeam, (row) => {
                            rows[index] = row;
                            setRows([...rows]);
                            setActiveCell([0, 0]);
                        });
                    })}
                </DropdownMenu>
            </Dropdown>
        );
    };

    // Function to render table rows
    const renderTableRows = () => {
        return rows.map((row, index) => (
            <tr key={index}>
                <td>
                    {renderTableRowControl(index, "search1")}
                </td>
                <td>
                    {playerCount == 2 && renderTableRowControl(index, "search2")}
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

    // Function to render player radio selection
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

    // Main render function
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
                    <Button variant="outline-primary" onClick={() => setRows([...rows, { search1: "", player1: new PlayerGetBasicDTO(), search2: "", player2: new PlayerGetBasicDTO(), teamName: new TeamGetBasicDTO(), teamSearch: "" }])}>
                        Add New Team
                    </Button>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" type="submit">
                        Continue
                    </Button>
                    <Button variant="secondary" onClick={() => {clearItems(); onCancel();}}>
                        Cancel
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}

export default StartGame;