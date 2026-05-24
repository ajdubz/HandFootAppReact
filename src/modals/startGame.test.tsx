import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import StartGame from "./startGame";
import MockApi from "../services/MockApi";
import GameService from "../services/GameService";
import PlayerService from "../services/PlayerService";
import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import { saveRuleDefaults } from "../rules/rulesDefaults";

describe("StartGame modal", () => {
    const originalApiUrl = process.env.REACT_APP_API_URL;
    const renderStartGame = (onConfirm = jest.fn()) => {
        render(
            <MemoryRouter>
                <StartGame id={1} isOpen onCancel={jest.fn()} onConfirm={onConfirm} />
            </MemoryRouter>
        );

        return onConfirm;
    };

    beforeEach(() => {
        process.env.REACT_APP_API_URL = "mock";
        localStorage.clear();
        MockApi.reset();
    });

    afterAll(() => {
        process.env.REACT_APP_API_URL = originalApiUrl;
    });

    test("add team does not submit the form", async () => {
        const onConfirm = renderStartGame();

        expect(await screen.findByDisplayValue("Alex")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /add new team/i }));

        expect(onConfirm).not.toHaveBeenCalled();
        expect(screen.getAllByPlaceholderText("Search Player 1 Name")).toHaveLength(2);
    });

    test("continues after creating teams for the new game", async () => {
        const onConfirm = renderStartGame();

        expect(await screen.findByDisplayValue("Alex")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /add new team/i }));

        const playerOneInputs = screen.getAllByPlaceholderText("Search Player 1 Name");
        fireEvent.change(playerOneInputs[1], { target: { value: "Jordan" } });
        fireEvent.click(screen.getByRole("button", { name: /continue/i }));

        await waitFor(() => expect(onConfirm).toHaveBeenCalled());
        const newGameId = onConfirm.mock.calls[0][0];
        const gameTeams = await GameService.getTeamsByGameId(newGameId);

        expect(newGameId).toBeGreaterThan(0);
        expect(gameTeams?.map((gameTeam) => gameTeam.team?.name)).toEqual(["Alex", "Jordan"]);
    });

    test("auto-names blank two-player teams from both players", async () => {
        const onConfirm = renderStartGame();

        expect(await screen.findByDisplayValue("Alex")).toBeInTheDocument();
        fireEvent.click(screen.getByLabelText("2 Players"));
        fireEvent.click(screen.getByRole("button", { name: /add new team/i }));

        const playerOneInputs = screen.getAllByPlaceholderText("Search Player 1 Name");
        const playerTwoInputs = screen.getAllByPlaceholderText("Search Player 2 Name");

        fireEvent.change(playerTwoInputs[0], { target: { value: "Sam" } });
        fireEvent.change(playerOneInputs[1], { target: { value: "Jordan" } });
        fireEvent.change(playerTwoInputs[1], { target: { value: "Casey" } });
        fireEvent.click(screen.getByRole("button", { name: /continue/i }));

        await waitFor(() => expect(onConfirm).toHaveBeenCalled());
        const newGameId = onConfirm.mock.calls[0][0];
        const gameTeams = await GameService.getTeamsByGameId(newGameId);

        expect(gameTeams?.map((gameTeam) => gameTeam.team?.name)).toEqual(["Alex and Sam", "Jordan and Casey"]);
    });

    test("starts two-player teams with multiple typed guest names", async () => {
        const onConfirm = renderStartGame();
        const dateSpy = jest.spyOn(Date, "now").mockReturnValue(1234567890);

        expect(await screen.findByDisplayValue("Alex")).toBeInTheDocument();
        fireEvent.click(screen.getByLabelText("2 Players"));
        fireEvent.click(screen.getByRole("button", { name: /add new team/i }));

        const playerOneInputs = screen.getAllByPlaceholderText("Search Player 1 Name");
        const playerTwoInputs = screen.getAllByPlaceholderText("Search Player 2 Name");

        fireEvent.change(playerTwoInputs[0], { target: { value: "Blaze" } });
        fireEvent.change(playerOneInputs[1], { target: { value: "Smoke" } });
        fireEvent.change(playerTwoInputs[1], { target: { value: "Kush" } });
        fireEvent.click(screen.getByRole("button", { name: /continue/i }));

        await waitFor(() => expect(onConfirm).toHaveBeenCalled());
        const newGameId = onConfirm.mock.calls[0][0];
        const gameTeams = await GameService.getTeamsByGameId(newGameId);

        expect(gameTeams?.map((gameTeam) => gameTeam.team?.name)).toEqual(["Alex and Blaze", "Smoke and Kush"]);

        dateSpy.mockRestore();
    });

    test("reuses existing guest players when retrying with the base name", async () => {
        const onConfirm = jest.fn();
        const guest = new PlayerAccountDTO();
        guest.nickName = "Blaze (Guest)";
        guest.fullName = "Blaze (Guest)";

        await PlayerService.createGuest(guest);

        renderStartGame(onConfirm);

        expect(await screen.findByDisplayValue("Alex")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /add new team/i }));

        const playerOneInputs = screen.getAllByPlaceholderText("Search Player 1 Name");
        fireEvent.change(playerOneInputs[1], { target: { value: "Blaze" } });
        fireEvent.click(screen.getByRole("button", { name: /continue/i }));

        await waitFor(() => expect(onConfirm).toHaveBeenCalled());
        const newGameId = onConfirm.mock.calls[0][0];
        const gameTeams = await GameService.getTeamsByGameId(newGameId);

        expect(gameTeams?.map((gameTeam) => gameTeam.team?.name)).toEqual(["Alex", "Blaze"]);
    });

    test("snapshots saved rule defaults when creating a game", async () => {
        const onConfirm = renderStartGame();
        saveRuleDefaults({
            cleanBookScore: 650,
            dirtyBookScore: 350,
            redThreeScore: 125,
            pulledScore: 25,
            winnerScore: 90,
            cardsToStart: 15,
            cardsToDraw: 4,
            roundOneBookThreshold: 60,
            roundTwoBookThreshold: 100,
            roundThreeBookThreshold: 130,
            roundFourBookThreshold: 160,
            cleanBooksRequiredToGoOut: 3,
            dirtyBooksRequiredToGoOut: 1,
        });

        expect(await screen.findByDisplayValue("Alex")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /add new team/i }));

        const playerOneInputs = screen.getAllByPlaceholderText("Search Player 1 Name");
        fireEvent.change(playerOneInputs[1], { target: { value: "Jordan" } });
        fireEvent.click(screen.getByRole("button", { name: /continue/i }));

        await waitFor(() => expect(onConfirm).toHaveBeenCalled());
        const newGameId = onConfirm.mock.calls[0][0];
        const newGame = await GameService.getGameById(newGameId);

        expect(newGame?.rules).toMatchObject({
            cleanBookScore: 650,
            dirtyBookScore: 350,
            redThreeScore: -125,
            pulledScore: 25,
            winnerScore: 90,
            cardsToStart: 15,
            cardsToDraw: 4,
            roundOneBookThreshold: 60,
            roundTwoBookThreshold: 100,
            roundThreeBookThreshold: 130,
            roundFourBookThreshold: 160,
            cleanBooksRequiredToGoOut: 3,
            dirtyBooksRequiredToGoOut: 1,
        });
    });
});
