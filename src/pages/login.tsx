import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import PlayerService from '../services/PlayerService';
import PlayerAccountDTO from '../models/DTOs/Player/PlayerAccountDTO';
import './login.css';
import { clearAuthState, setAuthState } from '../utils/auth';
import gameNightLogin from '../assets/game-night-login.jpg';

const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
    const navigate = useNavigate();
    const [emailOrName, setEmailOrName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleRegistration = () => {
        navigate("/register");
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
                setAuthState(data.id, data.token ?? "");
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

    const handleGuestLogin = async () => {
        clearAuthState();
        setError("");

        try {
            const data = await PlayerService.startGuestSession();
            onLogin();
            navigate(`/player/${data.id}`);
        } catch (guestLoginError) {
            clearAuthState();
            setError("Unable to start guest session");
            console.error("Error in guest login:", guestLoginError);
        }
    };

    return (
        <main
            className="login-stage"
            style={{ "--login-background-image": `url(${gameNightLogin})` } as React.CSSProperties}
        >
            <section className="login-panel" aria-labelledby="login-title">
                <p className="login-kicker">Family game night</p>
                <h1 id="login-title">Hand &amp; Foot Scorekeeper</h1>
                <p className="login-subtitle">
                    Keep the table moving with quick scoring, guest play, and easy account access.
                </p>

                <div className="login-fields">
                    <label htmlFor="emailOrName">Username or Email</label>
                    <input
                        id="emailOrName"
                        type="text"
                        aria-label="Username or Email"
                        value={emailOrName}
                        onChange={(e) => setEmailOrName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                        placeholder="Enter your username"
                    />

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        aria-label="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                        placeholder="Enter your password"
                    />
                </div>

                {error && <div className="login-error" role="alert">{error}</div>}

                <div className="login-actions">
                    <button className="login-button login-button-primary" type="button" onClick={handleLogin}>
                        Login
                    </button>
                    <button className="login-button login-button-secondary" type="button" onClick={handleRegistration}>
                        Create New Account
                    </button>
                    <button className="login-button login-button-guest" type="button" onClick={handleGuestLogin}>
                        Play as Guest
                    </button>
                </div>
            </section>
        </main>
    );
};

export default Login;
