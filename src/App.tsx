import React from "react";
import logo from "./logo.svg";
import PlayerListTable from "./player/playerList";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TeamListTable from "./team/teamList";

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
        <Route path="/teams" element={<TeamListTable />} />
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
