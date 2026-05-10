import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import PlayerService from '../services/PlayerService';
import PlayerAccountDTO from '../models/DTOs/Player/PlayerAccountDTO';
import './login.css';

const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
    const navigate = useNavigate();
    const [emailOrName, setEmailOrName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleRegistration = () => {
        navigate("/register");
    };

    const clearAuthState = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("mockPlayerId");
    };

    const handleLogin = async () => {
        if (!emailOrName.trim() || !password.trim()) {
            clearAuthState();
            setError("User and password required");
            return;
        }

        setError("");
        const player = new PlayerAccountDTO();
        if (emailOrName.includes('@')) {
            player.email = emailOrName;
        } else {
            player.nickName = emailOrName;
        }
        player.password = password;

        await PlayerService.LoginPlayer(player).then((data) => {
            const enteredValue = emailOrName.trim().toLowerCase();
            const matchesEmail = !!data?.email && data.email.toLowerCase() === enteredValue;
            const matchesNickname = !!data?.nickName && data.nickName.toLowerCase() === enteredValue;

            if (data && (matchesEmail || matchesNickname)) {
                onLogin();
                navigate(`/player/${data?.id}`);
                return;
            }

            clearAuthState();
            setError("Incorrect user or password");
        }).catch((loginError) => {
            clearAuthState();
            setError("Incorrect user or password");
            console.error("Error in LoginPlayer:", loginError);
        });
    };

    return (
        <div className="login-stage">
            <div
                className="login-artwork"
                style={{
                    backgroundImage: `url("${process.env.PUBLIC_URL}/new login page.png")`,
                }}
            >
                <input
                    className="overlay-input overlay-user"
                    type="text"
                    aria-label="Username or Email"
                    value={emailOrName}
                    onChange={(e) => setEmailOrName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                    placeholder="Enter your username"
                />
                <input
                    className="overlay-input overlay-password"
                    type="password"
                    aria-label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                    placeholder="Enter your password"
                />
                <button className="overlay-login-btn" type="button" onClick={handleLogin}>Login</button>
                <button className="overlay-register-btn" type="button" onClick={handleRegistration}>Registration</button>
                <input
                    className="overlay-dealer-input"
                    type="text"
                    readOnly
                    value=""
                    aria-label="Registration"
                    onClick={handleRegistration}
                />
                {error && <div className="overlay-error">{error}</div>}
            </div>
        </div>
    );
};

export default Login;
