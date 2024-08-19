import { useEffect, useState } from "react";
import { Player } from "../models/Player";
import PlayerService from "../services/PlayerService";
import { useParams } from "react-router-dom";

interface RouteParams {
    [id: string]: string | undefined;

}


function PlayerDetails() {
    const { id } = useParams<RouteParams>();
    const [player, setPlayer] = useState<Player>();

    useEffect(() => {
        const fetchData = async () => {
            const data = await PlayerService.getPlayerById(Number(id));
            setPlayer(data);
        };
        fetchData();
    }, [id]);


    return (
        <div>
            <h1>Player Details</h1>

            <form>
                <label>
                    Nickname:
                    <input type="text" name="nickname" defaultValue={player?.nickName} />
                </label>
                <label>
                    Team:
                    <input type="text" name="team" defaultValue={player?.team.name} />
                </label>
                <br />
                <label>
                    Friends
                </label>
                {player?.friends && ListFriends(player.friends)}
                <button>Save</button>
            </form>
        </div>
    );
}

function ListFriends(friends: Player[]) {
    return (
        <ul>
            {friends.map((friend) => {
                return <li key={friend.id}>{friend.nickName}</li>;
            })}
        </ul>
    );
}

export default PlayerDetails;
