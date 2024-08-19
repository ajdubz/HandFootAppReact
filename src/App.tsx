import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PlayerListTable from "./player/playerList";
import TeamListTable from "./team/teamList";
import PlayerEditor from "./player/playerEditor";
import PlayerDetails from "./player/playerDetails";

function NewHeader() {
    return (
        <nav>
            <a href="/players">Players</a>
            <a href="/teams">Teams</a>
        </nav>
    );
}

function NewRoutes() {



    return (
      <Router>
        <Routes>
          <Route path="/players" element={<PlayerListTable />} />
          <Route path="/player/:id" element={<PlayerDetails />} />
          {/* <Route path="/player/:id/edit" element={<PlayerEditor playerId={selectedId  } />} /> */}
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
