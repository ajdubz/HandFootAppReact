import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import './startGame.css';

interface StartGameProps {
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

interface Row {
    player1: string;
    player2: string;
    teamName: string;
}

function StartGame({ isOpen, onCancel, onConfirm }: StartGameProps) {
    const [rows, setRows] = useState<Row[]>([
        { player1: '', player2: '', teamName: '' },
        { player1: '', player2: '', teamName: '' }
    ]);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        
        onConfirm();
    };

    const handleCancel = () => {
        setRows([
            { player1: '', player2: '', teamName: '' },
            { player1: '', player2: '', teamName: '' }
        ]);

        onCancel();
    }


    const handleInputChange = (index: number, field: keyof Row, value: string) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);
    };

    const renderRows = () => {
        return rows.map((row, index) => (
            <tr key={index}>
                <td>
                    <label>
                        Team {index + 1}
                    </label>
                </td>
                <td>
                    <input
                        type="text"
                        value={row.player1}
                        onChange={(e) => handleInputChange(index, 'player1', e.target.value)}
                    />
                </td>
                <td>
                    <input
                        type="text"
                        value={row.player2}
                        onChange={(e) => handleInputChange(index, 'player2', e.target.value)}
                    />
                </td>
                <td>
                    <input
                        type="text"
                        value={row.teamName}
                        onChange={(e) => handleInputChange(index, 'teamName', e.target.value)}
                    />
                </td>
            </tr>
        ));
    };

    return (
        <Modal show={isOpen} onHide={onCancel}>
            <form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>Start Game</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <table className='table'>
                        <thead>
                            <tr>
                                <th></th>
                                <th>Player 1</th>
                                <th>Player 2</th>
                                <th>Team Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderRows()}
                        </tbody>
                    </table>
                    <Button variant="primary" onClick={() => setRows([...rows, { player1: '', player2: '', teamName: '' }])}>
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
