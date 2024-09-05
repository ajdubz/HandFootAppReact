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
    const [nickname, setNickname] = useState<string>(player?.nickName || '');    
    const [friends, setFriends] = useState<PlayerGetBasicDTO[] | undefined>([]);
    const navigate = useNavigate();
    const [showModalSave, setShowModalSave] = useState(false);
    const [showModalStart, setShowModalStart] = useState(false);

    const fetchData = async () => {

        await FriendService.getFriends(Number(id)).then((data) => setFriends(data)).catch((error) => { console.error("Error in getFriends:", error); return [] });


        await PlayerService.getPlayerFullDetailsById(Number(id))
            .then((data) => {
                setPlayer(data);
                setNickname(data?.nickName || '');
            })
            .catch((error) => {
                console.error("Error in getPlayerFullDetailsById:", error);
                setPlayer(new PlayerFullDetailsDTO());
            });


    };

    useEffect(() => {

        fetchData();
        
    }, [id]);


    const onSubmitFunc = () => {

            // Validate form values
        if (!nickname.trim()) {
            alert("Nickname is required");
            return;
        }

        if (id) {
            // Push to backend
            const playerData: PlayerAccountDTO = {
                nickName: nickname,
            };

            PlayerService.updatePlayerAccount(Number(id), playerData)
                .then(() => { navigate("/playersList"); })
                .catch((error) => { console.error("Error in updatePlayerAccount:", error); });
        }

    };

    const returnToList = () => {
        navigate(`/playersList`);
    };

    
    return (
        <div>
            <h2>Player Details</h2>
            <form onSubmit={(e) => e.preventDefault()}>
                <label>
                    Nickname:
                    <input type="text" name="nickname" defaultValue={nickname} onChange={(e) => setNickname(e.target.value)} />
                </label>
                <br />
                
                <br />
                <br />
                <div>
                    <Button variant="primary" onClick={() => setShowModalSave(true)}>
                        Save
                    </Button>
                    <Button variant="secondary" onClick={returnToList}>
                        Cancel
                    </Button>
                </div>
            </form>
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

            <StartGame id={Number(id)} isOpen={showModalStart} onCancel={() => setShowModalStart(false)} onConfirm={() => setShowModalStart(false)} />
            <ConfirmChanges isOpen={showModalSave} onConfirm={onSubmitFunc} onCancel={() => setShowModalSave(false) } />
        </div>
    );
}

function ListFriends(friends: PlayerGetBasicDTO[] | undefined) {
    return (
        <span>
            {friends?.map((friend) => (
                <span key={friend.id}><strong> <Link to={`/player/${friend.id}`}>{friend.nickName}</Link></strong></span>
            ))}
        </span>
    );
}

export default PlayerDetails;
