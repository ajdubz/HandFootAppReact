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
    const [showFriendListOne, setShowFriendListOne] = useState<boolean>(false);
    const [showFriendListTwo, setShowFriendListTwo] = useState<boolean>(false);
    const [rows, setRows] = useState<Row[]>([{ player1: "", player2: "", teamName: "" }]);
    const [activeRowIndex, setActiveRowIndex] = useState<number>(0);
    const [playerCount, setPlayerCount] = useState<number>(2); // Default to 2 players



    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        onConfirm();
    };

    const handleCancel = () => {
        setRows([{ player1: "", player2: "", teamName: "" }]);
        setSearchPlayersResults([]);
        setSearchPlayer2Results([]);
        setShowFriendListOne(false);
        setShowFriendListTwo(false);
        setActiveRowIndex(0);

        onCancel();
    };

    const handleInputChange = (index: number, field: keyof Row, value: string) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);
        if (field === "player1") {
            performFriendSearch(id, value, setSearchPlayersResults);
            setShowFriendListOne(true);
        } else if (field === "player2") {
            performFriendSearch(id, value, setSearchPlayer2Results);
            setShowFriendListTwo(true);
        }
    };




    const renderTableRows = () => {
        return rows.map((row, index) => (
            <tr key={index}>
                <td>
                    {renderPlayerControl(index, "player1")}
                </td>
                <td>
                    {playerCount == 2 && renderPlayerControl(index, "player2")}
                </td>
                <td>
                    <input type="text" value={row.teamName} onChange={(e) => handleInputChange(index, "teamName", e.target.value)} />
                </td>
                <td>
                    <Button variant="outline-danger" onClick={() => setRows(rows.filter((r, i) => i !== index))} >
                        Remove
                    </Button>
                </td>
            </tr>
        ));
    };


    const renderPlayerControl = (index: number, field: keyof Row) => {
        const column = field as string;
        const colNum = parseInt(column[column.length - 1]);
        const searchResults = colNum == 1 ? searchPlayersResults : searchPlayer2Results;
        const showFriendList = colNum == 1 ? showFriendListOne : showFriendListTwo;
        const setShowFriendList = colNum == 1 ? setShowFriendListOne : setShowFriendListTwo;



        return (
            <Dropdown show={activeRowIndex == index && showFriendList && searchResults != null} autoClose>
                <FormControl
                    autoFocus
                    placeholder={`Search Player ${colNum}`}
                    value={rows[index][field]}
                    onFocus={(e) => setActiveRowIndex(index)}
                    onChange={(e) => handleInputChange(index, field, e.target.value)}
                />
                <DropdownMenu>
                    {ListFriends(searchResults, (player) => { handleInputChange(index, field, player?.nickName ?? ""); setShowFriendList(false); })}
                </DropdownMenu>
            </Dropdown>
        );
    }


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
        <Modal show={isOpen} onHide={onCancel} centered size="lg" dialogClassName="">
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
                                {playerCount == 2 && <th>Player 2</th>}
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
