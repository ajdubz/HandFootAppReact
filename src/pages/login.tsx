import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import PlayerService from '../services/PlayerService';
import PlayerAccountDTO from '../models/DTOs/Player/PlayerAccountDTO';

const Login: React.FC<{ onLogin: () => void}> = ({onLogin}) => {
    const navigate = useNavigate();
    const [emailOrName, setEmailOrName] = useState('');
    const [password, setPassword] = useState('');

    const handleEmailOrNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmailOrName(e.target.value);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleRegistration = () => {
        navigate("/register");
    };

    const  handleLogin = async () => {
        let player = new PlayerAccountDTO();
        if(emailOrName.includes('@')) {
            player.email = emailOrName;
        } else {
            player.nickName = emailOrName;
        }
        player.password = password;
        
        await PlayerService.LoginPlayer(player).then((data) => {
            if (data) {
                onLogin();
                navigate(`/player/${data?.id}`);
            }
        }).catch((error) => {
            console.error("Error in LoginPlayer:", error);
        });
    };

    return (
        <div>
            <h2>Login</h2>
            <div>
            <div>
                <label>Username or Email:</label>
                <input type="text" value={emailOrName} onChange={handleEmailOrNameChange} onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }} />
            </div>
            <div>
                <label>Password:</label>
                <input type="password" value={password} onChange={handlePasswordChange} onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }} />
            </div>
            <div>
                <button type="button" onClick={handleLogin}>Login</button>
            </div>
            <div>
                <button type="button" onClick={handleRegistration}>Registration</button>
            </div>
            </div>
        </div>
    );
};

export default Login;
