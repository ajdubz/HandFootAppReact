import React, { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import "./startGame.css";
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

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        onConfirm();
    };

    const handleCancel = () => {
        setRows([{ player1: "", player2: "", teamName: "" }]);
        setSearchPlayersResults([]);
        setShowFriendListOne(false);
        setShowFriendListTwo(false);

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

    const renderRows = () => {
        return rows.map((row, index) => (
            <tr key={index}>
                <td>
                    <label>Team {index + 1}</label>
                </td>
                <td>
                    <Dropdown show={showFriendListOne && searchPlayersResults != null} autoClose>
                        <FormControl autoFocus placeholder="Search Player 1" value={row.player1} onChange={(e) => handleInputChange(index, "player1", e.target.value)} />
                        <DropdownMenu>
                            {showFriendListOne &&
                                searchPlayersResults &&
                                ListFriends(searchPlayersResults, (player) => {
                                    handleInputChange(index, "player1", player?.nickName ?? "");
                                    setShowFriendListOne(false);
                                })}
                        </DropdownMenu>
                    </Dropdown>
                </td>
                <td>
                    <Dropdown show={showFriendListTwo && searchPlayer2Results != null}>
                        <FormControl autoFocus placeholder="Search Player 2" value={row.player2} onChange={(e) => handleInputChange(index, "player2", e.target.value)} />
                        <DropdownMenu>
                            {showFriendListTwo &&
                                searchPlayer2Results &&
                                ListFriends(searchPlayer2Results, (player) => {
                                    handleInputChange(index, "player2", player?.nickName ?? "");
                                    setShowFriendListTwo(false);
                                })}
                        </DropdownMenu>
                    </Dropdown>
                </td>
                <td>
                    <input type="text" value={row.teamName} onChange={(e) => handleInputChange(index, "teamName", e.target.value)} />
                </td>
            </tr>
        ));
    };

    return (
        <Modal show={isOpen} onHide={onCancel} centered size="lg" dialogClassName="">
            <form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>Start Game</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <table className="tableClass">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Player 1</th>
                                <th>Player 2</th>
                                <th>Team Name</th>
                            </tr>
                        </thead>
                        <tbody>{renderRows()}</tbody>
                    </table>
                    <Button variant="primary" onClick={() => setRows([...rows, { player1: "", player2: "", teamName: "" }])}>
                        Add Team
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
