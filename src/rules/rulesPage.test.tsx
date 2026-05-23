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
    const renderRulesPage = () => {
        render(
            <MemoryRouter initialEntries={["/rules"]}>
                <Routes>
                    <Route path="/rules" element={<RulesPage />} />
                    <Route path="/player/:id" element={<PlayerDetailsStub />} />
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
        });

        renderRulesPage();

        expect(screen.getByLabelText(/clean book/i)).toHaveValue(650);
        expect(screen.getByLabelText(/dirty book/i)).toHaveValue(350);
        expect(screen.getByLabelText(/red 3 penalty/i)).toHaveValue(-125);
        expect(screen.getByLabelText(/cards to start/i)).toHaveValue(15);
        expect(screen.getByLabelText(/cards to draw/i)).toHaveValue(4);
    });

    test("saves edited defaults", () => {
        renderRulesPage();

        fireEvent.change(screen.getByLabelText(/clean book/i), { target: { value: "800" } });
        fireEvent.change(screen.getByLabelText(/red 3 penalty/i), { target: { value: "150" } });
        fireEvent.change(screen.getByLabelText(/cards to draw/i), { target: { value: "3" } });
        fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

        expect(screen.getByRole("heading", { name: /player details/i })).toBeInTheDocument();
        expect(screen.getByText(/rule defaults saved for new games/i)).toBeInTheDocument();
        expect(loadRuleDefaults()).toEqual({
            ...buildDefaultRules(),
            cleanBookScore: 800,
            redThreeScore: -150,
            cardsToDraw: 3,
        });
    });

    test("resets defaults", () => {
        saveRuleDefaults({ cleanBookScore: 800, redThreeScore: 150, cardsToDraw: 3 });

        renderRulesPage();

        fireEvent.click(screen.getByRole("button", { name: /reset to defaults/i }));

        expect(screen.getByText(/rule defaults reset/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/clean book/i)).toHaveValue(500);
        expect(screen.getByLabelText(/red 3 penalty/i)).toHaveValue(-300);
        expect(loadRuleDefaults()).toEqual(buildDefaultRules());
    });

    test("back leaves without saving edits", () => {
        renderRulesPage();

        fireEvent.change(screen.getByLabelText(/clean book/i), { target: { value: "800" } });
        fireEvent.click(screen.getByRole("button", { name: /back/i }));

        expect(screen.getByRole("heading", { name: /player details/i })).toBeInTheDocument();
        expect(loadRuleDefaults()).toEqual(buildDefaultRules());
    });
});
