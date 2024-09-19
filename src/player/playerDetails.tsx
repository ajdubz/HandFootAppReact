import { useEffect, useState } from "react";
import PlayerService from "../services/PlayerService";
import FriendService from "../services/FriendService";
import { useParams, useNavigate, Link } from "react-router-dom";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import TeamService from "../services/TeamService";
import TeamGetBasicDTO from "../models/DTOs/Team/TeamGetBasicDTO";
import PlayerFullDetailsDTO from "../models/DTOs/Player/PlayerFullDetailsDTO";
import Button from "react-bootstrap/Button";
import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import ConfirmChanges from "../modals/confirmChanges";
import StartGame from "../modals/startGame";

interface RouteParams {
    [id: string]: string | undefined;
}

function PlayerDetails() {
    const { id = "" } = useParams<RouteParams>();
    const [player, setPlayer] = useState<PlayerFullDetailsDTO | undefined>();
    const [nickname, setNickname] = useState<string>(player?.nickName || "");
    // const [showModalSave, setShowModalSave] = useState(false);
    const [showModalStart, setShowModalStart] = useState(false);
    const navigate = useNavigate();

    
    const fetchData = async () => {
        await PlayerService.getPlayerFullDetailsById(Number(id))
            .then((data) => {
                setPlayer(data);
                setNickname(data?.nickName || "");
            })
            .catch((error) => {
                console.error("Error in getPlayerFullDetailsById:", error);
                setPlayer(new PlayerFullDetailsDTO());
            });
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleConfirm = (newGameId: number) => {
        setShowModalStart(false);
        navigate(`/player/${id}/game/${newGameId}`);
    };

    return (
        <div>
            <h2>Player Details</h2>
            <div>
                <label>
                    Nickname:
                    <input type="text" name="nickname" defaultValue={nickname} disabled />
                </label>
                <br />
            </div>
            <br />
            <br />
            <Link to={`/player/${id}/account`}>Account </Link>
            <br />
            <Link to={`/player/${id}/friends`}> See Friends</Link>
            <br />
            <br />
            <Button variant="primary" onClick={() => setShowModalStart(true)}>
                Start Game
            </Button>

            <StartGame id={Number(id)} isOpen={showModalStart} onCancel={() => setShowModalStart(false)} onConfirm={(newGameId) => handleConfirm(newGameId)} />
            {/* <ConfirmChanges isOpen={showModalSave} onConfirm={onSubmitFunc} onCancel={() => setShowModalSave(false)} /> */}
        </div>
    );
}

export default PlayerDetails;
