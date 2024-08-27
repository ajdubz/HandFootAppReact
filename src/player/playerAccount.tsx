import { useEffect, useState } from "react";
import PlayerService from "../services/PlayerService";
import { useParams, useNavigate } from "react-router-dom";
import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import ConfirmChanges from "../modals/confirmChanges";
import Button from "react-bootstrap/Button";

interface RouteParams {
    [id: string]: string | undefined;
}

function PlayerAccount(): React.ReactElement {
    const { id = "" } = useParams<RouteParams>();
    const [player, setPlayer] = useState<PlayerAccountDTO>();
    const [nickname, setNickname] = useState<string>(player?.nickName || "");
    const [email, setEmail] = useState<string>(player?.email || "");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const navigate = useNavigate();
    const [showModalDelete, setShowModalDelete] = useState(false);
    const [showModalSave, setShowModalSave] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const players = !id ? new PlayerAccountDTO() : await PlayerService.getPlayerAccountById(Number(id));
            setPlayer(players);

            setEmail(players?.email || "");
            setNickname(players?.nickName || "");
        };

        fetchData();
    }, []);

    const onSubmitFunc = () => {

        setShowModalSave(false);

        // Validate form values
        if (!nickname?.trim()) {
            alert("Nickname is required");
            return;
        }

        if (!email?.trim()) {
            alert("Email is required");
            return;
        }

        if (!password?.trim()) {
            alert("Password is required");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        const playerData: PlayerAccountDTO = {
            nickName: nickname,
            email: email,
            password: password,
        };

        if (id) {
            PlayerService.updatePlayerAccount(Number(id), playerData)
                .then(() => { navigate(`/player/${id}`); })
                .catch((error) => { console.log(error); });
        } else {
            PlayerService.createPlayer(playerData)
                .then(() => { navigate(`/player/${id}`); })
                .catch((error) => { console.log(error); });
        }
    };

    const returnToDetails = () => {
        if(id) navigate(`/player/${id}`);
        else navigate(`/playersList`);
    };

    function handleModalConfirm(): void {
        setShowModalDelete(false);
        PlayerService.deletePlayer(Number(id))
            .then(() => { navigate("/playersList"); })
            .catch((error) => { console.log(error); });
    }

    return (
        <div>
            <h2>Player Details</h2>
            <form onSubmit={(e) => e.preventDefault()}>
                <label>
                    Nickname:
                    <input type="text" name="nickname" defaultValue={nickname} onChange={(e) => setNickname(e.target.value)} />
                </label>
                <br />
                <label>
                    Email:
                    <input type="email" name="email" defaultValue={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                <br />
                <label>
                    Password:
                    <input type="password" name="password" defaultValue={password} onChange={(e) => setPassword(e.target.value)} />
                </label>
                <br />
                <label>
                    Confirm Password:
                    <input type="password" name="password" onChange={(e) => setConfirmPassword(e.target.value)} />
                </label>
                <br />
                <br />
                <Button variant="primary" onClick={() => setShowModalSave(true)}>
                    Save
                </Button>
                <Button variant="secondary" onClick={returnToDetails}>
                    Cancel
                </Button>
                <br />
                <br />
                <Button variant="danger" onClick={() => setShowModalDelete(true)}>
                    Delete
                </Button>
                
            </form>
            <ConfirmChanges isOpen={showModalSave || showModalDelete} onConfirm={showModalDelete ? handleModalConfirm : onSubmitFunc} onCancel={() => showModalDelete ? setShowModalDelete(false) : setShowModalSave(false) } />
        </div>
    );
}

export default PlayerAccount;