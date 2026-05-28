import { useCallback, useEffect, useState } from "react";
import PlayerService from "../services/PlayerService";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PlayerFullDetailsDTO from "../models/DTOs/Player/PlayerFullDetailsDTO";
import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import Button from "react-bootstrap/Button";
import StartGame from "../modals/startGame";
import { isGuestSession } from "../utils/auth";
import { getActiveGameRoute } from "../utils/activeGame";
import "./playerDetails.css";

interface RouteParams {
    [id: string]: string | undefined;
}

function PlayerDetails() {
    const { id = "" } = useParams<RouteParams>();
    const location = useLocation();
    const rulesMessage = (location.state as { rulesMessage?: string } | null)?.rulesMessage ?? "";
    const currentPlayerId = Number(localStorage.getItem("currentPlayerId") ?? localStorage.getItem("mockPlayerId") ?? 0);
    const activeGameRoute = getActiveGameRoute(currentPlayerId);
    const [player, setPlayer] = useState<PlayerFullDetailsDTO | undefined>();
    const [nickname, setNickname] = useState<string>(player?.nickName || "");
    // const [showModalSave, setShowModalSave] = useState(false);
    const [showModalStart, setShowModalStart] = useState(false);
    const navigate = useNavigate();
    const canEditGuestNickname = isGuestSession() && Number(id) === currentPlayerId;

    
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

    const saveGuestNickname = async () => {
        if (!canEditGuestNickname) {
            return;
        }

        const nextNickname = nickname.trim() || "Guest Player";
        setNickname(nextNickname);

        const existingAccount = await PlayerService.getPlayerAccountById(Number(id));
        const playerData = Object.assign(new PlayerAccountDTO(), existingAccount, {
            nickName: nextNickname,
            fullName: nextNickname,
        });

        await PlayerService.updatePlayerAccount(Number(id), playerData);
    };

    const handleStartGame = async () => {
        try {
            await saveGuestNickname();
        } catch (error) {
            console.error("Error saving guest nickname:", error);
        }

        setShowModalStart(true);
    };

    return (
        <div>
            <h2>Player Details</h2>
            {rulesMessage && <div className="rules-save-message">{rulesMessage}</div>}
            <div>
                <label>
                    Nickname:
                    <input
                        type="text"
                        name="nickname"
                        value={nickname}
                        disabled={!canEditGuestNickname}
                        onBlur={() => { saveGuestNickname().catch((error) => console.error("Error saving guest nickname:", error)); }}
                        onChange={(event) => setNickname(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.currentTarget.blur();
                            }
                        }}
                    />
                </label>
                <br />
            </div>
            <div className="player-detail-actions" aria-label="Player actions">
                {activeGameRoute && (
                    <Button variant="success" onClick={() => navigate(activeGameRoute)}>
                        Back to Active Game
                    </Button>
                )}
                <Button variant="primary" onClick={handleStartGame}>
                    Start Game
                </Button>
            </div>

            <StartGame id={Number(id)} isOpen={showModalStart} onCancel={() => setShowModalStart(false)} onConfirm={(newGameId) => handleConfirm(newGameId)} />
            {/* <ConfirmChanges isOpen={showModalSave} onConfirm={onSubmitFunc} onCancel={() => setShowModalSave(false)} /> */}
        </div>
    );
}

export default PlayerDetails;
