import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { PlayerListTable } from "./player/playerList";
import { TeamListTable } from "./team/teamList";
import PlayerDetails from "./player/playerDetails";
import PlayerAccount from "./player/playerAccount";
import GamePage from "./game/gameHome";
import Login from "./pages/login";
import React from "react";
import { useState } from "react";
import PlayerFriends from "./player/playerFriends";
import PlayerService from "./services/PlayerService";
import TeamResults from "./team/teamResults";

function NewHeader() {
    return (
        <nav>
            <Link to="/playersList">Players</Link>
            <Link to="/teams">Teams</Link>
        </nav>
    );
}

const NewRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/playersList" element={<PlayerListTable />} />
            <Route path="/teams" element={<TeamListTable />} />
            <Route path="/team/:id" element={<TeamResults />} />

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

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login onLogin={handleLogin} />} />
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="/register" element={<PlayerAccount isRegistration />} />
                <Route path="/player/account" element={<PlayerAccount />} />
                <Route
                    path="/*"
                    element={<ProtectedRoutes isAuthenticated={isAuthenticated}>
                                <NewHeader />
                                <NewRoutes />
                            </ProtectedRoutes> }
                />
            </Routes>
        </Router>
    );
}

export default App;
