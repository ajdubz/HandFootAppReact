import { useState, useEffect } from "react";
import PlayerService from "../services/PlayerService";
import { Player } from "../models/Player";

function PlayerEditor({ playerId }: { playerId: number }) {
    let confirmPassword: string = "";

    const [player, setPlayer] = useState<Player>();

    useEffect(() => {
        const fetchData = async () => {
            const data = await PlayerService.getPlayerById(playerId);
            setPlayer(data);
        };
        fetchData();
    }, [playerId]);

    const handleSubmit = (event: any) => {
        event.preventDefault();
        const data = new FormData(event.target);
        console.log(data.get("nickname"));
        console.log(data.get("email"));
        console.log(data.get("password"));
        console.log(data.get("confirmPassword"));

    };

    return (
        <div>
            <h1>Player Details</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Nickname:
                    <input type="text" name="nickname" defaultValue={player?.nickName} />
                </label>
                <br />
                <label>
                    Email:
                    <input type="text" name="email" defaultValue={player?.email} />
                </label>
                <br />
                <label>
                    Password:
                    <input type="text" name="password" defaultValue={player?.password} />
                </label>
                <br />
                <label>
                    Confirm Password:
                    <input type="text" name="confirmPassword" defaultValue={confirmPassword} />
                </label>
                <br />
                <button>Save</button>
            </form>
        </div>
    );
}

export default PlayerEditor;
