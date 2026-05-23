import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import GamePage from "./gameHome";
import MockApi from "../services/MockApi";
import PlayerDetails from "../player/playerDetails";
import PlayerService from "../services/PlayerService";
import TeamService from "../services/TeamService";
import GameService from "../services/GameService";
import GameAddDTO from "../models/DTOs/Game/GameAddDTO";
import GameRoundDTO from "../models/DTOs/Game/GameRoundDTO";
import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import PlayerTeamCreateDTO from "../models/DTOs/Team/PlayerTeamCreateDTO";

const LocationDisplay = () => {
    const location = useLocation();
    return <div data-testid="location">{location.pathname}</div>;
};

const renderGamePage = () => {
    render(
        <MemoryRouter initialEntries={["/player/1/game/1"]}>
            <Routes>
                <Route path="/player/:id/game/:gameId" element={<GamePage />} />
            </Routes>
            <LocationDisplay />
        </MemoryRouter>
    );
};

const renderGamePageWithPlayerDetailsRoute = (initialEntry: string) => {
    render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route path="/player/:id/game/:gameId" element={<GamePage />} />
                <Route path="/player/:id" element={<PlayerDetails />} />
            </Routes>
            <LocationDisplay />
        </MemoryRouter>
    );
};

const clickSaveRound = () => {
    fireEvent.click(screen.getAllByRole("button", { name: /save round/i })[0]);
};

describe("GamePage round entry", () => {
    const originalApiUrl = process.env.REACT_APP_API_URL;

    beforeEach(() => {
        process.env.REACT_APP_API_URL = "mock";
        localStorage.clear();
        MockApi.reset();
    });

    afterAll(() => {
        process.env.REACT_APP_API_URL = originalApiUrl;
    });

    test("renders the current round entry grid", async () => {
        renderGamePage();

        expect(await screen.findByRole("heading", { name: /score round 1/i })).toBeInTheDocument();
        expect(await screen.findByLabelText("Alex and Sam Card Points")).toBeInTheDocument();
        expect(screen.getByLabelText("Jordan and Casey Card Points")).toBeInTheDocument();
        expect(screen.getByText(/book threshold: 50/i)).toBeInTheDocument();
        expect(screen.getByLabelText("Alex and Sam Pulled Correct 1")).toBeInTheDocument();
        expect(screen.getByLabelText("Alex and Sam Pulled Correct 2")).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: /save round/i })).toHaveLength(1);
        expect(screen.getByRole("button", { name: /new game/i })).toBeInTheDocument();
    });

    test("opens the start game modal from New Game", async () => {
        renderGamePage();

        fireEvent.click(await screen.findByRole("button", { name: /new game/i }));

        expect(await screen.findByText("Start Game")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
    });

    test("starts a new game from Game Center and navigates to it", async () => {
        renderGamePage();

        fireEvent.click(await screen.findByRole("button", { name: /new game/i }));
        expect(await screen.findByDisplayValue("Alex")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /add new team/i }));

        const playerOneInputs = screen.getAllByPlaceholderText("Search Player 1 Name");
        fireEvent.change(playerOneInputs[1], { target: { value: "Jordan" } });
        fireEvent.click(screen.getByRole("button", { name: /continue/i }));

        await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/player/1/game/2"));
    });

    test("end game preserves the active guest nickname", async () => {
        const guestLogin = await PlayerService.startGuestSession();
        const guestId = guestLogin.id ?? 0;
        const guestAccount = Object.assign(new PlayerAccountDTO(), await PlayerService.getPlayerAccountById(guestId), {
            nickName: "Wild Bill",
            fullName: "Wild Bill",
        });
        await PlayerService.updatePlayerAccount(guestId, guestAccount);

        const temporaryGuest = new PlayerAccountDTO();
        temporaryGuest.nickName = "Blaze (Guest)";
        temporaryGuest.fullName = "Blaze (Guest)";
        const temporaryGuestAccount = await PlayerService.createGuest(temporaryGuest);

        const newGame = await GameService.addGame(new GameAddDTO());
        const firstTeamCreate = new PlayerTeamCreateDTO();
        firstTeamCreate.playerId1 = guestId;
        firstTeamCreate.teamName = "Wild Bill";
        const firstTeam = await TeamService.addPlayersToNewTeam(firstTeamCreate);

        const secondTeamCreate = new PlayerTeamCreateDTO();
        secondTeamCreate.playerId1 = temporaryGuestAccount.id;
        secondTeamCreate.teamName = "Blaze";
        const secondTeam = await TeamService.addPlayersToNewTeam(secondTeamCreate);

        await GameService.addTeamToGame(newGame?.id ?? 0, firstTeam?.id ?? 0);
        await GameService.addTeamToGame(newGame?.id ?? 0, secondTeam?.id ?? 0);

        const gameTeams = await GameService.getTeamsByGameId(newGame?.id ?? 0);
        for (const roundNumber of [1, 2, 3, 4]) {
            await Promise.all((gameTeams ?? []).map((gameTeam) => {
                const round = new GameRoundDTO();
                round.gameTeam = gameTeam;
                round.roundNumber = roundNumber;
                round.handScore = 0;
                return GameService.saveGameRound(newGame?.id ?? 0, round);
            }));
        }

        renderGamePageWithPlayerDetailsRoute(`/player/${guestId}/game/${newGame?.id}`);

        fireEvent.click(await screen.findByRole("button", { name: /end game/i }));

        expect(await screen.findByRole("heading", { name: /player details/i })).toBeInTheDocument();
        expect(await screen.findByDisplayValue("Wild Bill")).toBeInTheDocument();
        expect(await PlayerService.getPlayerAccountById(guestId)).toMatchObject({ nickName: "Wild Bill" });
        expect(await PlayerService.getPlayerAccountById(temporaryGuestAccount.id ?? 0)).toBeUndefined();
    });

    test("renders mobile scoring cards with touch-friendly controls", async () => {
        renderGamePage();

        expect(await screen.findByLabelText("Mobile Alex and Sam Card Points")).toBeInTheDocument();
        expect(screen.getByLabelText("Mobile Alex and Sam Clean Books")).toBeInTheDocument();
        expect(screen.getByLabelText("Mobile Alex and Sam Dirty Books")).toBeInTheDocument();
        expect(screen.getByLabelText("Mobile Alex and Sam Red 3s")).toBeInTheDocument();
        expect(screen.getByLabelText("Mobile Alex and Sam Pulled Correct 1")).toBeInTheDocument();
        expect(screen.getByLabelText("Mobile Alex and Sam Pulled Correct 2")).toBeInTheDocument();
        expect(screen.getByLabelText("Mobile Alex and Sam Went Out")).toBeInTheDocument();
        expect(screen.getByLabelText("Mobile scoreboard")).toBeInTheDocument();
        expect(screen.getByLabelText("Mobile previous rounds")).toBeInTheDocument();
    });

    test("saves a mock round and refreshes the scoreboard", async () => {
        renderGamePage();

        await screen.findByLabelText("Alex and Sam Card Points");

        fireEvent.change(screen.getByLabelText("Alex and Sam Card Points"), { target: { value: "100" } });
        fireEvent.change(screen.getByLabelText("Alex and Sam Clean Books"), { target: { value: "1" } });
        fireEvent.change(screen.getByLabelText("Alex and Sam Red 3s"), { target: { value: "1" } });
        fireEvent.click(screen.getByLabelText("Alex and Sam Pulled Correct 1"));
        fireEvent.click(screen.getByLabelText("Alex and Sam Pulled Correct 2"));
        fireEvent.click(screen.getByLabelText("Alex and Sam Went Out"));
        clickSaveRound();

        expect(await screen.findByRole("heading", { name: /score round 2/i })).toBeInTheDocument();
        await waitFor(() => expect(screen.getAllByText("500").length).toBeGreaterThan(0));
        expect(screen.getByText("No")).toBeInTheDocument();
    });

    test("lets pulled-correct checkboxes work independently", async () => {
        renderGamePage();

        const firstPulled = await screen.findByLabelText("Alex and Sam Pulled Correct 1");
        const secondPulled = screen.getByLabelText("Alex and Sam Pulled Correct 2");

        fireEvent.click(secondPulled);

        expect(firstPulled).not.toBeChecked();
        expect(secondPulled).toBeChecked();
        expect(screen.getAllByText("50").length).toBeGreaterThan(0);
    });

    test("clamps red threes to positive counts", async () => {
        renderGamePage();

        const redThrees = await screen.findByLabelText("Alex and Sam Red 3s");

        fireEvent.change(redThrees, { target: { value: "-2" } });

        expect(redThrees).toHaveValue(0);
    });

    test("stops round entry after four saved rounds", async () => {
        renderGamePage();

        await screen.findByLabelText("Alex and Sam Card Points");

        for (const roundNumber of [1, 2, 3, 4]) {
            clickSaveRound();

            const nextHeading = roundNumber === 4
                ? /game complete/i
                : new RegExp(`score round ${roundNumber + 1}`, "i");
            expect(await screen.findByRole("heading", { name: nextHeading })).toBeInTheDocument();
        }

        screen.getAllByRole("button", { name: /save round/i }).forEach((button) => {
            expect(button).toBeDisabled();
        });
        expect(screen.getByText(/game complete\. winner:/i)).toBeInTheDocument();
    });
});
