import { useEffect, useState } from "react";
import PlayerService from "../services/PlayerService";
import { useParams, useNavigate } from "react-router-dom";
import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";

interface RouteParams {
    [id: string]: string | undefined;
}


function PlayerAccount() {
    const { id = "" } = useParams<RouteParams>();
    const [player, setPlayer] = useState<PlayerAccountDTO>();
    const [nickname, setNickname] = useState<string>(player?.nickName || '');
    const [email, setEmail] = useState<string>(player?.email || '');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            
            const players = !id ? new PlayerAccountDTO : await PlayerService.getPlayerAccountById(Number(id));
            setPlayer(players);
    
            setEmail(players?.email || '');
            setNickname(players?.nickName || '');
        };
        
        fetchData();
        
    }, [id, PlayerService, navigate]);

    const onSubmitFunc = (e: React.FormEvent) => {
        e.preventDefault();

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

        PlayerService.createPlayer(playerData);
        

        navigate("/playersList");
    };

    const onCancelFunc = () => {
        navigate("/playersList");
    };

    
    return (
        <div>
            <h2>Player Details</h2>
            <form onSubmit={onSubmitFunc}>
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
                <button type="submit">Save</button>
                <button type="button" onClick={onCancelFunc}>
                    Cancel
                </button>
            </form>
        </div>
    );
}


export default PlayerAccount;