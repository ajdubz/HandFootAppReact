import React, { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import Rules from "../models/Rules";
import NumericStepper from "../components/NumericStepper";
import { loadRuleDefaults, normalizeRules, resetRuleDefaults, saveRuleDefaults } from "./rulesDefaults";
import { getActiveGameRoute, isActiveGameRoute } from "../utils/activeGame";
import "./rulesPage.css";

type RuleField = {
    key: keyof Rules;
    label: string;
    help: string;
    clampInputMax?: boolean;
    max?: number;
    min?: number;
    step?: number;
};

const scoringFields: RuleField[] = [
    { key: "cleanBookScore", label: "Clean book", help: "Points for each clean book.", min: 0, step: 25 },
    { key: "dirtyBookScore", label: "Dirty book", help: "Points for each dirty book.", min: 0, step: 25 },
    { key: "redThreeScore", label: "Red 3 penalty", help: "Saved as a negative penalty even if entered positive.", clampInputMax: false, max: 0, step: 25 },
    { key: "pulledScore", label: "Pulled correct", help: "Points per player who pulled correctly.", min: 0, step: 10 },
    { key: "winnerScore", label: "Went out", help: "Bonus for the team that goes out.", min: 0, step: 10 },
];

const dealFields: RuleField[] = [
    { key: "cardsToStart", label: "Cards to start", help: "Saved for table setup before a new game.", min: 0 },
    { key: "cardsToDraw", label: "Cards to draw", help: "Saved for table setup before a new game.", min: 0 },
];

const bookThresholdFields: RuleField[] = [
    { key: "roundOneBookThreshold", label: "Round 1 book threshold", help: "Minimum card points needed before books count in round 1.", min: 0, step: 10 },
    { key: "roundTwoBookThreshold", label: "Round 2 book threshold", help: "Minimum card points needed before books count in round 2.", min: 0, step: 10 },
    { key: "roundThreeBookThreshold", label: "Round 3 book threshold", help: "Minimum card points needed before books count in round 3.", min: 0, step: 10 },
    { key: "roundFourBookThreshold", label: "Round 4 book threshold", help: "Minimum card points needed before books count in round 4.", min: 0, step: 10 },
];

const goingOutFields: RuleField[] = [
    { key: "cleanBooksRequiredToGoOut", label: "Clean books to go out", help: "Clean books required before a team can go out.", min: 0 },
    { key: "dirtyBooksRequiredToGoOut", label: "Dirty books to go out", help: "Dirty books required before a team can go out.", min: 0 },
];

const getFieldValue = (rules: Rules, key: keyof Rules): number => {
    const value = rules[key];
    return typeof value === "number" ? value : 0;
};

const getPlayerDetailsRoute = () => {
    const currentPlayerId = Number(localStorage.getItem("currentPlayerId") ?? localStorage.getItem("mockPlayerId") ?? 0);
    return currentPlayerId ? `/player/${currentPlayerId}` : "/playersList";
};

function RulesPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as { returnToGame?: string } | null;
    const returnToGame = state?.returnToGame;
    const currentPlayerId = Number(localStorage.getItem("currentPlayerId") ?? localStorage.getItem("mockPlayerId") ?? 0);
    const activeGameRoute = isActiveGameRoute(returnToGame)
        ? returnToGame
        : getActiveGameRoute(currentPlayerId);
    const [rules, setRules] = useState<Rules>(() => loadRuleDefaults());
    const [isDirty, setIsDirty] = useState(false);
    const [savedMessage, setSavedMessage] = useState("");

    useEffect(() => {
        setRules(loadRuleDefaults());
    }, []);

    const updateRule = (key: keyof Rules, value: string) => {
        setRules((currentRules) => normalizeRules({
            ...currentRules,
            [key]: Number(value),
        }));
        setIsDirty(true);
        setSavedMessage("");
    };

    const handleSave = (event: React.FormEvent) => {
        event.preventDefault();
        saveRuleDefaults(rules);
        setIsDirty(false);
        navigate(getPlayerDetailsRoute(), {
            state: { rulesMessage: "Rule defaults saved for new games." },
        });
    };

    const handleReset = () => {
        setRules(resetRuleDefaults());
        setIsDirty(false);
        setSavedMessage("Rule defaults reset.");
    };

    const handleBackToActiveGame = () => {
        navigate(activeGameRoute);
    };

    const renderField = (field: RuleField) => (
        <Form.Group className="rules-field" controlId={`rules-${String(field.key)}`} key={String(field.key)}>
            <Form.Label>{field.label}</Form.Label>
            <NumericStepper
                ariaDescribedBy={`rules-${String(field.key)}-help`}
                ariaLabel={field.label}
                clampInputMax={field.clampInputMax}
                max={field.max}
                min={field.min}
                onChange={(value) => updateRule(field.key, value)}
                step={field.step}
                value={getFieldValue(rules, field.key)}
            />
            <Form.Text id={`rules-${String(field.key)}-help`}>{field.help}</Form.Text>
        </Form.Group>
    );

    return (
        <main className="rules-page">
            <header className="rules-header">
                <div>
                    <p className="rules-eyebrow">New game setup</p>
                    <h1>Rules Defaults</h1>
                    <p>Set the starting values for future scorecards. Games already underway keep their current rules.</p>
                </div>
                {activeGameRoute && (
                    <Button type="button" variant="success" onClick={handleBackToActiveGame}>
                        Back to Active Game
                    </Button>
                )}
            </header>

            {savedMessage && <div className="rules-save-message">{savedMessage}</div>}

            <Form className="rules-form" onSubmit={handleSave}>
                <section className="rules-section">
                    <div className="rules-section-heading">
                        <div>
                            <p>Points</p>
                            <h2>Scoring</h2>
                        </div>
                        <span>5 settings</span>
                    </div>
                    <p className="rules-section-description">Choose the book, penalty, and round-ending point values.</p>
                    <div className="rules-grid">
                        {scoringFields.map(renderField)}
                    </div>
                </section>

                <section className="rules-section">
                    <div className="rules-section-heading">
                        <div>
                            <p>Table setup</p>
                            <h2>Deal Preferences</h2>
                        </div>
                        <span>2 settings</span>
                    </div>
                    <p className="rules-section-description">Keep the usual starting hand and draw count ready for each new game.</p>
                    <div className="rules-grid">
                        {dealFields.map(renderField)}
                    </div>
                </section>

                <section className="rules-section">
                    <div className="rules-section-heading">
                        <div>
                            <p>Four rounds</p>
                            <h2>Book Thresholds</h2>
                        </div>
                        <span>4 settings</span>
                    </div>
                    <p className="rules-section-description">Set the minimum card points needed before books count in each round.</p>
                    <div className="rules-grid">
                        {bookThresholdFields.map(renderField)}
                    </div>
                </section>

                <section className="rules-section">
                    <div className="rules-section-heading">
                        <div>
                            <p>Round requirements</p>
                            <h2>Going Out</h2>
                        </div>
                        <span>2 settings</span>
                    </div>
                    <p className="rules-section-description">Choose how many clean and dirty books a team needs before going out.</p>
                    <div className="rules-grid">
                        {goingOutFields.map(renderField)}
                    </div>
                </section>

                <div className="rules-actions">
                    <div className="rules-actions-status" aria-live="polite">
                        {isDirty ? "Unsaved changes" : "Defaults are up to date"}
                    </div>
                    <div className="rules-actions-buttons">
                        <Button type="submit" variant="primary">Save</Button>
                        <Button type="button" variant="outline-secondary" onClick={handleReset}>Reset to Defaults</Button>
                    </div>
                </div>
            </Form>
        </main>
    );
}

export default RulesPage;
