import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

interface ConfirmChangesProps {
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

function ConfirmChanges({ isOpen, onCancel, onConfirm }: ConfirmChangesProps) {
    
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        onConfirm();
    };

    // backdrop="static" keyboard={false} for not allowing click outside the modal or escape key to close the modal
    return (
        <Modal show={isOpen} onHide={onCancel}>
            <form>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Changes</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to continue?</Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" type="button" onClick={handleSubmit}>
                        Continue
                    </Button>
                    <Button variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}

export default ConfirmChanges;