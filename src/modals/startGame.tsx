import React, { useCallback, useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import "./startGame.css";
import "../App.css";
import { ListFriends, performFriendSearch } from "../player/playerList";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import Dropdown from "react-bootstrap/Dropdown";
import FormControl from "react-bootstrap/FormControl";
import { DropdownMenu } from "react-bootstrap";
import { ListTeams, performPlayerTeamSearch } from "../team/teamList";
import PlayerFullDetailsDTO from "../models/DTOs/Player/PlayerFullDetailsDTO";
import TeamGetWithPlayerNamesDTO from "../models/DTOs/Team/TeamGetWithPlayerNamesDTO";
import { performRowValidation, CustomRow, setNewPlayer, setNewPlayerTeam, handlePlayerSelection, setNewGame, addTeamToGame, getDefaultTeamName, getCurrentPlayer } from "./startGameUtils";

// Interface for component props
interface StartGameProps {
    id: number;
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: (newGameId: number) => void;
}

const getErrorMessage = (error: unknown) => error instanceof Error && error.message
    ? error.message
    : "Check the teams and try again.";

// Main component function
function StartGame({ id, isOpen, onCancel, onConfirm }: StartGameProps) {
    // State variables
    const [currentPlayer, setCurrentPlayer] = useState<PlayerFullDetailsDTO | undefined>(undefined);
    const [searchResults, setSearchResults] = useState<{ players1: PlayerGetBasicDTO[] | undefined, players2: PlayerGetBasicDTO[] | undefined, teams: TeamGetWithPlayerNamesDTO[] | undefined }>({ players1: [], players2: [], teams: [] });
    const [rows, setRows] = useState<CustomRow[]>([{ search1: "", player1: new PlayerGetBasicDTO(), search2: "", player2: new PlayerGetBasicDTO(), teamName: new TeamGetWithPlayerNamesDTO(), teamSearch: "" }]);
    const [activeCell, setActiveCell] = useState<number[]>([0, 0]);
    const [playerCount, setPlayerCount] = useState<number>(1); // Default to 2 players, but for testing I set it to 1
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [startGameError, setStartGameError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createInitialRow = useCallback((player?: PlayerFullDetailsDTO): CustomRow => {
        const playerBasic = player
            ? Object.assign(new PlayerGetBasicDTO(), {
                id,
                nickName: player.nickName,
                fullName: player.fullName,
            })
            : new PlayerGetBasicDTO();

        return { search1: player?.nickName ?? "", player1: playerBasic, search2: "", player2: new PlayerGetBasicDTO(), teamName: new TeamGetWithPlayerNamesDTO(), teamSearch: "" };
    }, [id]);

    // Function to clear search results and errors, and reset rows
    const clearItems = useCallback((player?: PlayerFullDetailsDTO) => {
        setSearchResults({ players1: [], players2: [], teams: [] });
        setErrors({});
        setRows([createInitialRow(player)]);
        setPlayerCount(1);
        setActiveCell([0, 0]);
        setStartGameError("");
        setIsSubmitting(false);
    }, [createInitialRow]);

    // Effect to reset items when modal is opened
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        getCurrentPlayer(id, (data) => {
            setCurrentPlayer(data);
            clearItems(data);
        }, () => {
            const emptyPlayer = new PlayerFullDetailsDTO();
            setCurrentPlayer(emptyPlayer);
            clearItems(emptyPlayer);
        });
    }, [clearItems, id, isOpen]);

    // Function to handle form submission
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setErrors({});
        setStartGameError("");
        const newErrors: { [key: string]: string } = {};


        const tempErrors = performRowValidation(rows, playerCount);
        Object.assign(newErrors, tempErrors);


        if(Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);

        try {
            const resolvedRows = rows.map((row) => ({ ...row }));

            for (const row of resolvedRows) {
                if(!row.player1?.id && row.search1.trim()) {
                    row.player1 = await setNewPlayer(row, 1, (tempPlayer1) => { row.player1 = tempPlayer1; });
                }

                if(!row.player2?.id && row.search2.trim() && playerCount === 2) {
                    row.player2 = await setNewPlayer(row, 2, (tempPlayer2) => { row.player2 = tempPlayer2; });
                }

                if (!row.player1?.id || (playerCount === 2 && !row.player2?.id)) {
                    throw new Error("Unable to resolve players for team");
                }

                const teamName = row.teamSearch.trim() || getDefaultTeamName(row, playerCount);
                row.teamSearch = teamName;
            }

            let newGame = await setNewGame(() => {return;});

            if (!newGame || !newGame.id || newGame.id === 0) {
                throw new Error("Error creating game, " + (newGame?.id ?? "undefined id"));
            }

            for (const row of resolvedRows) {
                // Always create a fresh team for a new game so the scoreboard only reflects
                // the users selected in this Start Game session.
                const createdTeam = await setNewPlayerTeam(row, row.teamSearch);
                const teamId = createdTeam?.id ?? 0;

                if (!teamId) {
                    throw new Error("Unable to resolve team for game");
                }

                await addTeamToGame(newGame.id, teamId);
            }

            setRows(resolvedRows);
            onConfirm(newGame.id);
        } catch (error) {
            console.error("Error starting game:", error);
            setStartGameError(`Unable to start game. ${getErrorMessage(error)}`);
        } finally {
            setIsSubmitting(false);
        }
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
            let tempPlayer = newRows[index].player1;
            performPlayerTeamSearch(tempPlayer?.id ?? 0, value, (teams) => setSearchResults({ ...searchResults, teams }));
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
        const list = colNum === 3 ? ListTeams : ListFriends;
        const errorKey = `${field}${index}`;
        const errorMessage = errors[errorKey];
        const currentCell = activeCell[0] === index && activeCell[1] === colNum;
        const hasValue = rows[index][field] as string;

        return (
            <Dropdown show={hasValue !== "" && searchResults?.length !== 0 && currentCell} autoClose>
                <FormControl
                    autoFocus
                    placeholder={isPlayer ? `Search Player ${colNum} Name` : `Search Team Name`}
                    value={hasValue}
                    onFocus={() => setActiveCell([index, colNum])}
                    onChange={(e) => handleInputChange(index, field, e.target.value)}
                    className={`form-control-outline ${errorMessage ? "is-invalid" : ""}`}
                    disabled={isPlayer && colNum === 1 && index === 0 && rows[index].player1?.nickName === currentPlayer?.nickName}
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
                    {playerCount === 2 && renderTableRowControl(index, "search2")}
                </td>
                <td>
                    {renderTableRowControl(index, "teamSearch")}
                </td>
                <td>
                    <Button type="button" variant="outline-danger" onClick={() => setRows(rows.filter((r, i) => i !== index))} >
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
                    {startGameError && <div className="start-game-error">{startGameError}</div>}
                    <br />
                    <h5>Enter team details:</h5>
                    <table className="tableClass">
                        <thead>
                            <tr>
                                <th>Player 1</th>
                            <th>{playerCount === 2 && "Player 2"}</th>
                                <th>Team Name</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderTableRows()}
                        </tbody>
                    </table>
                    <br />
                    <Button type="button" variant="outline-primary" onClick={() => setRows([...rows, { search1: "", player1: new PlayerGetBasicDTO(), search2: "", player2: new PlayerGetBasicDTO(), teamName: new TeamGetWithPlayerNamesDTO(), teamSearch: "" }])}>
                        Add New Team
                    </Button>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Starting..." : "Continue"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => { clearItems(currentPlayer); onCancel(); }}>
                        Cancel
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}

export default StartGame;
