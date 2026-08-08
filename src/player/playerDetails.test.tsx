import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import MockApi from "../services/MockApi";
import PlayerDetails from "./playerDetails";
import GameService from "../services/GameService";
import GameRoundDTO from "../models/DTOs/Game/GameRoundDTO";

describe("PlayerDetails home dashboard", () => {
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

    test("shows game actions, summary, and recent game without account fields", async () => {
        localStorage.setItem("activeGameRoute", "/player/1/game/4");

        render(
            <MemoryRouter initialEntries={["/player/1"]}>
                <Routes>
                    <Route path="/player/:id" element={<PlayerDetails />} />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByRole("heading", { name: /ready to play/i })).toBeInTheDocument();
        expect(await screen.findByRole("button", { name: /back to active game/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /start game/i })).toBeInTheDocument();
        expect(screen.queryByLabelText(/nickname/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/public player id/i)).not.toBeInTheDocument();
        expect((await screen.findByText("Games played")).parentElement).toHaveTextContent("Games played0");
        expect(screen.getByRole("link", { name: /continue game/i })).toHaveAttribute("href", "/player/1/game/1");
        expect(screen.getByRole("link", { name: /view all games/i })).toHaveAttribute("href", "/games");
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

        expect(await screen.findByRole("heading", { name: /ready to play/i })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /back to active game/i })).not.toBeInTheDocument();
    });

    test("hides and clears the active game link after round four", async () => {
        const gameTeams = await GameService.getTeamsByGameId(1);
        for (const roundNumber of [1, 2, 3, 4]) {
            await Promise.all((gameTeams ?? []).map((gameTeam) => {
                const round = new GameRoundDTO();
                round.gameTeam = gameTeam;
                round.roundNumber = roundNumber;
                return GameService.saveGameRound(1, round);
            }));
        }
        localStorage.setItem("activeGameRoute", "/player/1/game/1");

        render(
            <MemoryRouter initialEntries={["/player/1"]}>
                <Routes>
                    <Route path="/player/:id" element={<PlayerDetails />} />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByRole("heading", { name: /ready to play/i })).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.queryByRole("button", { name: /back to active game/i })).not.toBeInTheDocument();
            expect(localStorage.getItem("activeGameRoute")).toBeNull();
        });
    });
});
