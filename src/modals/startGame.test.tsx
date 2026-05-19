import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import StartGame from "./startGame";
import MockApi from "../services/MockApi";
import GameService from "../services/GameService";
import PlayerService from "../services/PlayerService";
import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";

describe("StartGame modal", () => {
    const originalApiUrl = process.env.REACT_APP_API_URL;

    beforeEach(() => {
        process.env.REACT_APP_API_URL = "mock";
        localStorage.clear();
        MockApi.reset();
    });

    afterAll(() => {
        process.env.REACT_APP_API_URL = originalApiUrl;
    });

    test("add team does not submit the form", async () => {
        const onConfirm = jest.fn();

        render(<StartGame id={1} isOpen onCancel={jest.fn()} onConfirm={onConfirm} />);

        expect(await screen.findByDisplayValue("Alex")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /add new team/i }));

        expect(onConfirm).not.toHaveBeenCalled();
        expect(screen.getAllByPlaceholderText("Search Player 1 Name")).toHaveLength(2);
    });

    test("continues after creating teams for the new game", async () => {
        const onConfirm = jest.fn();

        render(<StartGame id={1} isOpen onCancel={jest.fn()} onConfirm={onConfirm} />);

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
        const onConfirm = jest.fn();

        render(<StartGame id={1} isOpen onCancel={jest.fn()} onConfirm={onConfirm} />);

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

    test("reuses existing guest players when retrying with the base name", async () => {
        const onConfirm = jest.fn();
        const guest = new PlayerAccountDTO();
        guest.nickName = "Blaze (Guest)";
        guest.fullName = "Blaze (Guest)";

        await PlayerService.createGuest(guest);

        render(<StartGame id={1} isOpen onCancel={jest.fn()} onConfirm={onConfirm} />);

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
});
