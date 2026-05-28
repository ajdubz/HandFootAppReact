import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import MockApi from "../services/MockApi";
import PlayerDetails from "./playerDetails";

describe("PlayerDetails active game link", () => {
    const originalApiUrl = process.env.REACT_APP_API_URL;

    beforeEach(() => {
        process.env.REACT_APP_API_URL = "mock";
        localStorage.clear();
        MockApi.reset();
        localStorage.setItem("currentPlayerId", "1");
    });

    afterAll(() => {
        process.env.REACT_APP_API_URL = originalApiUrl;
    });

    test("shows a return button when the current player has an active game", async () => {
        localStorage.setItem("activeGameRoute", "/player/1/game/4");

        render(
            <MemoryRouter initialEntries={["/player/1"]}>
                <Routes>
                    <Route path="/player/:id" element={<PlayerDetails />} />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByRole("button", { name: /back to active game/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /start game/i })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /account/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /see friends/i })).not.toBeInTheDocument();
    });

    test("hides stale active game links for another player", async () => {
        localStorage.setItem("activeGameRoute", "/player/2/game/4");

        render(
            <MemoryRouter initialEntries={["/player/1"]}>
                <Routes>
                    <Route path="/player/:id" element={<PlayerDetails />} />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByRole("heading", { name: /player details/i })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /back to active game/i })).not.toBeInTheDocument();
    });
});
