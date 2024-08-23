import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PlayerListTable from "./player/playerList";
import TeamListTable from "./team/teamList";
import PlayerDetails from "./player/playerDetails";
import PlayerAccount from "./player/playerAccount";

function NewHeader() {
    return (
        <nav>
            <a href="/playersList">Players</a>
            <a href="/teams">Teams</a>
        </nav>
    );
}

function NewRoutes() {

    return (
        <Router>
            <Routes>
                <Route path="/playersList" element={<PlayerListTable />} />
                <Route path="/player/:id" element={<PlayerDetails />} />
                <Route path="/player/account" element={<PlayerAccount />} />
                <Route path="/player/:id/account" element={<PlayerAccount />} />
                <Route path="/teams" element={<TeamListTable />} />
                <Route path="/team/:id" element={<TeamListTable />} />
            </Routes>
        </Router>
    );
    
}

function App() {
    return (
        <div>
            <NewHeader />
            <NewRoutes />
        </div>
    );
}

export default App;
