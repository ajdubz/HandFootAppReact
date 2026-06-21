import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { PlayerListTable } from "./player/playerList";
import { TeamListTable } from "./team/teamList";
import PlayerDetails from "./player/playerDetails";
import PlayerAccount from "./player/playerAccount";
import GamePage from "./game/gameHome";
import Login from "./pages/login";
import React, { useEffect, useRef, useState } from "react";
import PlayerFriends from "./player/playerFriends";
import PlayerService from "./services/PlayerService";
import TeamResults from "./team/teamResults";
import { clearAuthState } from "./utils/auth";
import RulesPage from "./rules/rulesPage";
import "./App.css";
import "./appHeader.css";

const gameRoutePattern = /^\/player\/\d+\/game\/\d+$/;

const NewHeader: React.FC<{ onSignOut: () => void }> = ({ onSignOut }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const menuRef = useRef<HTMLElement | null>(null);
    const menuButtonRef = useRef<HTMLButtonElement | null>(null);
    const currentPlayerId = localStorage.getItem("currentPlayerId") ?? localStorage.getItem("mockPlayerId") ?? "";
    const homeRoute = currentPlayerId ? `/player/${currentPlayerId}` : "/playersList";
    const accountRoute = currentPlayerId ? `/player/${currentPlayerId}/account` : "/player/account";
    const friendsRoute = currentPlayerId ? `/player/${currentPlayerId}/friends` : "/playersList";

    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsMenuOpen(false);
            }
        };

        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, []);

    useEffect(() => {
        if (!isMenuOpen) {
            return;
        }

        const closeOnOutsideClick = (event: MouseEvent) => {
            const clickTarget = event.target as Node;
            if (menuRef.current?.contains(clickTarget) || menuButtonRef.current?.contains(clickTarget)) {
                return;
            }

            setIsMenuOpen(false);
        };

        document.addEventListener("mousedown", closeOnOutsideClick);
        return () => document.removeEventListener("mousedown", closeOnOutsideClick);
    }, [isMenuOpen]);

    const handleSignOut = () => {
        setIsMenuOpen(false);
        onSignOut();
    };

    return (
        <header className="app-header">
            <button
                type="button"
                ref={menuButtonRef}
                className={`hamburger-button${isMenuOpen ? " is-open" : ""}`}
                aria-expanded={isMenuOpen}
                aria-controls="primary-menu"
                aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                onClick={() => setIsMenuOpen((current) => !current)}
            >
                <span />
                <span />
                <span />
            </button>
            <div className="app-header-title">Hand & Foot</div>
            <nav
                id="primary-menu"
                ref={menuRef}
                className={`top-drawer-menu${isMenuOpen ? " is-open" : ""}`}
                aria-label="Primary navigation"
            >
                <Link to={homeRoute}>Home</Link>
                <Link to="/playersList">Players</Link>
                <Link to="/teams">Teams</Link>
                <Link to="/rules" state={gameRoutePattern.test(location.pathname) ? { returnToGame: location.pathname } : undefined}>Rules</Link>
                <Link to={accountRoute}>Account</Link>
                <Link to={friendsRoute}>Friends</Link>
                <Link to="/login" onClick={handleSignOut}>Sign out</Link>
            </nav>
        </header>
    );
};

const NewRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/playersList" element={<PlayerListTable />} />
            <Route path="/teams" element={<TeamListTable />} />
            <Route path="/team/:id" element={<TeamResults />} />
            <Route path="/rules" element={<RulesPage />} />

            <Route path="/player/account" element={<PlayerAccount />} />
            <Route path="/player/:id" element={<PlayerDetails />} />
            <Route path="/player/:id/friends" element={<PlayerFriends />} />
            <Route path="/player/:id/account" element={<PlayerAccount />} />
            <Route path="/player/:id/game/:gameId" element={<GamePage />} />
        </Routes>
    );
};

const ProtectedRoutes: React.FC<{ isAuthenticated: boolean; children: React.ReactNode }> = ({ isAuthenticated, children }) => {
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(PlayerService.getIsAuthenticated());

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const handleSignOut = () => {
        clearAuthState();
        setIsAuthenticated(false);
    };

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login onLogin={handleLogin} />} />
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="/register" element={<div className="app-main app-main-public"><PlayerAccount isRegistration /></div>} />
                <Route path="/player/account" element={<div className="app-main app-main-public"><PlayerAccount /></div>} />
                <Route
                    path="/*"
                    element={<ProtectedRoutes isAuthenticated={isAuthenticated}>
                                <NewHeader onSignOut={handleSignOut} />
                                <div className="app-main">
                                    <NewRoutes />
                                </div>
                            </ProtectedRoutes> }
                />
            </Routes>
        </Router>
    );
}

export default App;
