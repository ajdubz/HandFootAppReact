import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import { PlayerListTable } from "./player/playerList";
import { TeamListTable } from "./team/teamList";
import PlayerDetails from "./player/playerDetails";
import PlayerAccount from "./player/playerAccount";
import Login from "./pages/login";
import React from "react";
import { useState } from "react";
import PlayerFriends from "./player/playerFriends";
import PlayerService from "./services/PlayerService";

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
            <Route path="/player/:id" element={<PlayerDetails />} />
            <Route path="/player/:id/friends" element={<PlayerFriends />} />
            <Route path="/player/account" element={<PlayerAccount />} />
            <Route path="/player/:id/account" element={<PlayerAccount />} />
            <Route path="/teams" element={<TeamListTable />} />
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
                <Route
                    path="/*"
                    element={
                        <ProtectedRoutes isAuthenticated={isAuthenticated}>
                            <NewHeader />
                            <NewRoutes />
                        </ProtectedRoutes>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
