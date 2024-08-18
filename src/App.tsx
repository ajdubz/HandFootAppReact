import React from "react";
import logo from "./logo.svg";
import ListTable from "./player/list";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

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
        <Route path="/players" element={<ListTable />} />
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
