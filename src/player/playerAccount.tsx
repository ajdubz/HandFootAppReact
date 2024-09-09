import { useEffect, useState } from "react";
import PlayerService from "../services/PlayerService";
import { useParams, useNavigate } from "react-router-dom";
import { Form } from "react-bootstrap";
import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import ConfirmChanges from "../modals/confirmChanges";
import Button from "react-bootstrap/Button";
import Player from "../models/Player";
import { Container, Row, Col } from "react-bootstrap";

interface RouteParams {
    [id: string]: string | undefined;
}

function PlayerAccount(): React.ReactElement {
    const { id = "" } = useParams<RouteParams>();
    const [player, setPlayer] = useState<PlayerAccountDTO | undefined>();
    const [nickname, setNickname] = useState<string>(player?.nickName ?? "");
    const [fullName, setFullName] = useState<string>(player?.fullName ?? "");
    const [email, setEmail] = useState<string>(player?.email ?? "");
    const [password, setPassword] = useState<string>(player?.password ?? "");
    const [confirmPassword, setConfirmPassword] = useState<string>(player?.password ?? "");
    const navigate = useNavigate();
    const [showModalDelete, setShowModalDelete] = useState(false);
    const [showModalSave, setShowModalSave] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const fetchData = async () => {
        await PlayerService.getPlayerAccountById(Number(id))
            .then((response) => {
                // setPlayer(response);
                setPlayer(response);
                setEmail(response?.email ?? "");
                setNickname(response?.nickName ?? "");
                setFullName(response?.fullName ?? "");
                setPassword(response?.password ?? "");
                setConfirmPassword(response?.password ?? "");
            })
            .catch((error) => {
                console.log(error);
            });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreatePlayer = async () => {
        const playerData: PlayerAccountDTO = {
            nickName: nickname,
            email: email,
            password: password,
            fullName: fullName,
        };

        await PlayerService.createPlayer(playerData)
            .then(() => { id ? navigate(`/player/${id}`) : navigate("/playersList"); })
            .catch((error) => { console.log(error); });
    };

    const deletePlayer = async () => {
        await PlayerService.deletePlayer(Number(id))
            .then(() => { navigate("/playersList"); })
            .catch((error) => { console.log(error); });
    };

    const handleUpdatePlayer = async () => {
        const playerData: PlayerAccountDTO = {
            nickName: nickname,
            email: email,
            password: password,
            fullName: fullName,
        };

        await PlayerService.updatePlayerAccount(Number(id), playerData)
            .then(() => { navigate(`/player/${id}`); })
            .catch((error) => { console.log(error); });
    }

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!nickname || nickname.trim() === "") {
            newErrors.nickname = "Nickname is required";
        }

        if (!fullName || fullName.trim() === "") {
            newErrors.fullName = "Full Name is required";
        }

        if (!email || email.trim() === "") {
            newErrors.email = "Email is required";
        }

        // Uncomment if password validation is needed
        // if (!password.trim()) {
        //   newErrors.password = "Password is required";
        // }

        // if (password !== confirmPassword) {
        //   newErrors.confirmPassword = "Passwords do not match";
        // }

        return newErrors;
    };

    const onSubmitFunc = () => {
        // e.preventDefault();
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (id) {
            // console.log("Update player");
            handleUpdatePlayer();
        } else {
            handleCreatePlayer();
            // console.log("Create player");
        }

        returnToDetails();
    };

    const returnToDetails = () => {
        if (id) navigate(`/player/${id}`);
        else navigate(`/playersList`);
    };

    function handleModalConfirm(): void {
        if (showModalSave) {
            setShowModalSave(false);
            onSubmitFunc();
        } else {
            setShowModalDelete(false);
            deletePlayer();
        }
    }

    return (
        <>
            <h2>Player Account Details</h2>
            <Form onSubmit={(e) => e.preventDefault()}>
                <Row>
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label htmlFor="id">Id</Form.Label>
                            <Form.Control type="text" id="id" name="id" defaultValue={id} disabled />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label htmlFor="nickname">Nickname</Form.Label>
                            <Form.Control type="text" id="nickname" name="nickname" defaultValue={nickname} onChange={(e) => setNickname(e.target.value)} />
                            {errors.nickname && <div className="text-danger">{errors.nickname}</div>}
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label htmlFor="fullName">Full Name</Form.Label>
                            <Form.Control type="text" id="fullName" name="fullName" defaultValue={fullName} onChange={(e) => setFullName(e.target.value)} />
                            {errors.fullName && <div className="text-danger">{errors.fullName}</div>}
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label htmlFor="email">Email</Form.Label>
                            <Form.Control type="email" id="email" name="email" defaultValue={email} onChange={(e) => setEmail(e.target.value)} />
                            {errors.email && <div className="text-danger">{errors.email}</div>}
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label htmlFor="password">Password</Form.Label>
                            <Form.Control type="password" id="password" name="password" defaultValue={password} onChange={(e) => setPassword(e.target.value)} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label htmlFor="confirmPassword">Confirm Password</Form.Label>
                            <Form.Control type="password" id="confirmPassword" name="confirmPassword" defaultValue={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </Form.Group>
                    </Col>
                </Row>
                <Button type="submit" variant="primary" className="me-2" onClick={() => setShowModalSave(true)}>
                    Save
                </Button>
                <Button type="button" variant="secondary" className="me-2" onClick={returnToDetails}>
                    Cancel
                </Button>
                <Button type="button" className="btn-danger" onClick={() => setShowModalDelete(true)}>
                    Delete
                </Button>
            </Form>
            <ConfirmChanges
                isOpen={showModalSave || showModalDelete}
                onConfirm={handleModalConfirm}
                onCancel={() => (showModalDelete ? setShowModalDelete(false) : setShowModalSave(false))}
            />
        </>

        // <div>
        //     <h2>Player Account Details</h2>
        //     <form >
        //         <div className="col-md-2">
        //             <div className="mb-3 ">
        //                 <label htmlFor="id" className="form-label">Id</label>
        //                 <input type="text" className="form-control" id="id" name="id" defaultValue={id} disabled />
        //             </div>
        //             <div className="mb-3">
        //                 <label htmlFor="nickname" className="form-label">Nickname</label>
        //                 <input type="text" className="form-control" id="nickname" name="nickname" defaultValue={nickname} onChange={(e) => setNickname(e.target.value)} />
        //             </div>
        //             <div className="mb-3">
        //                 <label htmlFor="fullName" className="form-label">Full Name</label>
        //                 <input type="text" className="form-control" id="fullName" name="fullName" defaultValue={fullName} onChange={(e) => setFullName(e.target.value)} />
        //             </div>
        //             <div className="mb-3">
        //                 <label htmlFor="email" className="form-label">Email</label>
        //                 <input type="email" className="form-control" id="email" name="email" defaultValue={email} onChange={(e) => setEmail(e.target.value)} />
        //             </div>
        //             <div className="mb-3">
        //                 <label htmlFor="password" className="form-label">Password</label>
        //                 <input type="password" className="form-control" id="password" name="password" defaultValue={password} onChange={(e) => setPassword(e.target.value)} />
        //             </div>
        //             <div className="mb-3">
        //                 <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
        //                 <input type="password" className="form-control" id="confirmPassword" name="confirmPassword" defaultValue={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        //             </div>
        //         </div>
        //         <button type="submit" className="btn btn-primary me-2" onClick={onSubmitFunc}>Save</button>
        //         <button type="button" className="btn btn-secondary me-2" onClick={returnToDetails}>Cancel</button>
        //         <button type="button" className="btn btn-danger" onClick={() => setShowModalDelete(true)}>Delete</button>
        //     </form>
        //     <ConfirmChanges isOpen={showModalSave || showModalDelete} onConfirm={showModalDelete ? handleModalConfirm : returnToDetails} onCancel={() => showModalDelete ? setShowModalDelete(false) : setShowModalSave(false) } />
        // </div>
    );
}

export default PlayerAccount;
