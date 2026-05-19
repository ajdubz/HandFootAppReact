import { useCallback, useEffect, useState } from "react";
import PlayerService from "../services/PlayerService";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import PlayerFullDetailsDTO from "../models/DTOs/Player/PlayerFullDetailsDTO";
import Button from "react-bootstrap/Button";
import StartGame from "../modals/startGame";

interface RouteParams {
    [id: string]: string | undefined;
}

function PlayerDetails() {
    const { id = "" } = useParams<RouteParams>();
    const location = useLocation();
    const currentPlayerId = Number(localStorage.getItem("currentPlayerId") ?? localStorage.getItem("mockPlayerId") ?? 0);
    const [player, setPlayer] = useState<PlayerFullDetailsDTO | undefined>();
    const [nickname, setNickname] = useState<string>(player?.nickName || "");
    // const [showModalSave, setShowModalSave] = useState(false);
    const [showModalStart, setShowModalStart] = useState(false);
    const navigate = useNavigate();

    
    const fetchData = useCallback(async () => {
        await PlayerService.getPlayerFullDetailsById(Number(id))
            .then((data) => {
                setPlayer(data);
                setNickname(data?.nickName || "");
            })
            .catch((error) => {
                console.error("Error in getPlayerFullDetailsById:", error);
                setPlayer(new PlayerFullDetailsDTO());
            });
    }, [id]);

    useEffect(() => {
        if (currentPlayerId && Number(id) !== currentPlayerId) {
            navigate(`/player/${currentPlayerId}`);
            return;
        }

        fetchData();
    }, [currentPlayerId, fetchData, id, navigate]);

    useEffect(() => {
        const shouldOpenStartGame = new URLSearchParams(location.search).get("startGame") === "true";
        if (shouldOpenStartGame) {
            setShowModalStart(true);
        }
    }, [location.search]);

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
