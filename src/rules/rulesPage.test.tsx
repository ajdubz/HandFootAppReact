import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import RulesPage from "./rulesPage";
import { buildDefaultRules, loadRuleDefaults, saveRuleDefaults } from "./rulesDefaults";

const PlayerDetailsStub = () => {
    const location = useLocation();
    const rulesMessage = (location.state as { rulesMessage?: string } | null)?.rulesMessage ?? "";

    return (
        <>
            <h1>Player Details</h1>
            {rulesMessage && <div>{rulesMessage}</div>}
        </>
    );
};

describe("RulesPage", () => {
    const getRuleInput = (name: string | RegExp) => screen.getByRole("spinbutton", { name });

    const renderRulesPage = (initialEntries: Parameters<typeof MemoryRouter>[0]["initialEntries"] = ["/rules"]) => {
        render(
            <MemoryRouter initialEntries={initialEntries}>
                <Routes>
                    <Route path="/rules" element={<RulesPage />} />
                    <Route path="/player/:id" element={<PlayerDetailsStub />} />
                    <Route path="/player/:id/game/:gameId" element={<h1>Game Center</h1>} />
                    <Route path="/playersList" element={<h1>Players</h1>} />
                </Routes>
            </MemoryRouter>
        );
    };

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem("currentPlayerId", "5");
    });

    test("renders saved defaults", () => {
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

        renderRulesPage();

        expect(getRuleInput("Clean book")).toHaveValue(650);
        expect(getRuleInput("Dirty book")).toHaveValue(350);
        expect(getRuleInput("Red 3 penalty")).toHaveValue(-125);
        expect(getRuleInput("Cards to start")).toHaveValue(15);
        expect(getRuleInput("Cards to draw")).toHaveValue(4);
        expect(getRuleInput("Round 1 book threshold")).toHaveValue(60);
        expect(getRuleInput("Round 4 book threshold")).toHaveValue(160);
        expect(getRuleInput("Clean books to go out")).toHaveValue(3);
        expect(getRuleInput("Dirty books to go out")).toHaveValue(1);
    });

    test("saves edited defaults", () => {
        renderRulesPage();

        fireEvent.change(getRuleInput("Clean book"), { target: { value: "0800" } });
        fireEvent.change(getRuleInput("Red 3 penalty"), { target: { value: "150" } });
        fireEvent.change(getRuleInput("Cards to draw"), { target: { value: "3" } });
        fireEvent.change(getRuleInput("Round 2 book threshold"), { target: { value: "95" } });
        fireEvent.change(getRuleInput("Clean books to go out"), { target: { value: "3" } });
        fireEvent.change(getRuleInput("Dirty books to go out"), { target: { value: "1" } });
        expect(getRuleInput("Clean book")).toHaveValue(800);
        fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

        expect(screen.getByRole("heading", { name: /player details/i })).toBeInTheDocument();
        expect(screen.getByText(/rule defaults saved for new games/i)).toBeInTheDocument();
        expect(loadRuleDefaults()).toEqual({
            ...buildDefaultRules(),
            cleanBookScore: 800,
            redThreeScore: -150,
            cardsToDraw: 3,
            roundTwoBookThreshold: 95,
            cleanBooksRequiredToGoOut: 3,
            dirtyBooksRequiredToGoOut: 1,
        });
    });

    test("resets defaults", () => {
        saveRuleDefaults({ cleanBookScore: 800, redThreeScore: 150, cardsToDraw: 3 });

        renderRulesPage();

        fireEvent.click(screen.getByRole("button", { name: /reset to defaults/i }));

        expect(screen.getByText(/rule defaults reset/i)).toBeInTheDocument();
        expect(getRuleInput("Clean book")).toHaveValue(500);
        expect(getRuleInput("Red 3 penalty")).toHaveValue(-300);
        expect(getRuleInput("Round 1 book threshold")).toHaveValue(50);
        expect(getRuleInput("Clean books to go out")).toHaveValue(2);
        expect(loadRuleDefaults()).toEqual(buildDefaultRules());
    });

    test("shows explicit rule steppers for touch screens", () => {
        renderRulesPage();

        fireEvent.click(screen.getByRole("button", { name: "Increase Clean book" }));
        expect(getRuleInput("Clean book")).toHaveValue(525);

        fireEvent.click(screen.getByRole("button", { name: "Decrease Clean book" }));
        expect(getRuleInput("Clean book")).toHaveValue(500);

        fireEvent.click(screen.getByRole("button", { name: "Increase Pulled correct" }));
        expect(getRuleInput("Pulled correct")).toHaveValue(60);

        fireEvent.click(screen.getByRole("button", { name: "Increase Went out" }));
        expect(getRuleInput("Went out")).toHaveValue(110);

        fireEvent.click(screen.getByRole("button", { name: "Increase Round 1 book threshold" }));
        expect(getRuleInput("Round 1 book threshold")).toHaveValue(60);

        fireEvent.click(screen.getByRole("button", { name: "Increase Cards to draw" }));
        expect(getRuleInput("Cards to draw")).toHaveValue(3);
    });

    test("keeps non-red rule values non-negative", () => {
        renderRulesPage();

        fireEvent.change(getRuleInput("Clean book"), { target: { value: "-5" } });
        expect(getRuleInput("Clean book")).toHaveValue(0);

        fireEvent.click(screen.getByRole("button", { name: "Decrease Clean book" }));
        expect(getRuleInput("Clean book")).toHaveValue(0);

        fireEvent.change(getRuleInput("Round 1 book threshold"), { target: { value: "-10" } });
        expect(getRuleInput("Round 1 book threshold")).toHaveValue(0);
    });

    test("keeps red 3 penalty inverse while stopping increases at zero", () => {
        renderRulesPage();

        fireEvent.change(getRuleInput("Red 3 penalty"), { target: { value: "25" } });
        expect(getRuleInput("Red 3 penalty")).toHaveValue(-25);

        fireEvent.click(screen.getByRole("button", { name: "Increase Red 3 penalty" }));
        expect(getRuleInput("Red 3 penalty")).toHaveValue(0);

        fireEvent.click(screen.getByRole("button", { name: "Increase Red 3 penalty" }));
        expect(getRuleInput("Red 3 penalty")).toHaveValue(0);

        fireEvent.click(screen.getByRole("button", { name: "Decrease Red 3 penalty" }));
        expect(getRuleInput("Red 3 penalty")).toHaveValue(-25);
    });

    test("back leaves without saving edits", () => {
        renderRulesPage();

        fireEvent.change(getRuleInput("Clean book"), { target: { value: "800" } });
        fireEvent.click(screen.getByRole("button", { name: /back/i }));

        expect(screen.getByRole("heading", { name: /player details/i })).toBeInTheDocument();
        expect(loadRuleDefaults()).toEqual(buildDefaultRules());
    });

    test("returns to the active game when one is available", () => {
        localStorage.setItem("activeGameRoute", "/player/5/game/8");

        renderRulesPage();

        fireEvent.click(screen.getAllByRole("button", { name: /back to active game/i })[0]);

        expect(screen.getByRole("heading", { name: /game center/i })).toBeInTheDocument();
    });

    test("prefers the game route that opened rules", () => {
        localStorage.setItem("activeGameRoute", "/player/5/game/8");

        renderRulesPage([{ pathname: "/rules", state: { returnToGame: "/player/5/game/9" } }]);

        fireEvent.click(screen.getAllByRole("button", { name: /back to active game/i })[0]);

        expect(screen.getByRole("heading", { name: /game center/i })).toBeInTheDocument();
    });
});
