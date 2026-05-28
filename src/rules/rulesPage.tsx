import React, { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import Rules from "../models/Rules";
import NumericStepper from "../components/NumericStepper";
import { buildDefaultRules, loadRuleDefaults, normalizeRules, resetRuleDefaults, saveRuleDefaults } from "./rulesDefaults";
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
    const [savedMessage, setSavedMessage] = useState("");

    useEffect(() => {
        setRules(loadRuleDefaults());
    }, []);

    const updateRule = (key: keyof Rules, value: string) => {
        setRules((currentRules) => normalizeRules({
            ...currentRules,
            [key]: Number(value),
        }));
        setSavedMessage("");
    };

    const handleSave = (event: React.FormEvent) => {
        event.preventDefault();
        saveRuleDefaults(rules);
        navigate(getPlayerDetailsRoute(), {
            state: { rulesMessage: "Rule defaults saved for new games." },
        });
    };

    const handleReset = () => {
        setRules(resetRuleDefaults());
        setSavedMessage("Rule defaults reset.");
    };

    const handleBack = () => {
        navigate(activeGameRoute || getPlayerDetailsRoute());
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

    const defaults = buildDefaultRules();

    return (
        <main className="rules-page">
            <div className="rules-header">
                <div>
                    <h1>Rules Defaults</h1>
                    <p>These values apply to newly created games. Existing games keep their saved rules.</p>
                </div>
                {activeGameRoute && (
                    <Button type="button" variant="success" onClick={handleBackToActiveGame}>
                        Back to Active Game
                    </Button>
                )}
            </div>

            {savedMessage && <div className="rules-save-message">{savedMessage}</div>}

            <Form className="rules-form" onSubmit={handleSave}>
                <section className="rules-section">
                    <h2>Scoring</h2>
                    <div className="rules-grid">
                        {scoringFields.map(renderField)}
                    </div>
                </section>

                <section className="rules-section">
                    <h2>Deal Preferences</h2>
                    <div className="rules-grid">
                        {dealFields.map(renderField)}
                    </div>
                </section>

                <section className="rules-section">
                    <h2>Book Thresholds</h2>
                    <div className="rules-grid">
                        {bookThresholdFields.map(renderField)}
                    </div>
                </section>

                <section className="rules-section">
                    <h2>Going Out</h2>
                    <div className="rules-grid">
                        {goingOutFields.map(renderField)}
                    </div>
                </section>

                <section className="rules-section rules-defaults-summary" aria-label="Built-in defaults">
                    <h2>Built-in Defaults</h2>
                    <dl>
                        <div><dt>Clean book</dt><dd>{defaults.cleanBookScore}</dd></div>
                        <div><dt>Dirty book</dt><dd>{defaults.dirtyBookScore}</dd></div>
                        <div><dt>Red 3</dt><dd>{defaults.redThreeScore}</dd></div>
                        <div><dt>Pulled correct</dt><dd>{defaults.pulledScore}</dd></div>
                        <div><dt>Went out</dt><dd>{defaults.winnerScore}</dd></div>
                        <div><dt>Cards to start</dt><dd>{defaults.cardsToStart}</dd></div>
                        <div><dt>Cards to draw</dt><dd>{defaults.cardsToDraw}</dd></div>
                        <div><dt>Round 1 threshold</dt><dd>{defaults.roundOneBookThreshold}</dd></div>
                        <div><dt>Round 2 threshold</dt><dd>{defaults.roundTwoBookThreshold}</dd></div>
                        <div><dt>Round 3 threshold</dt><dd>{defaults.roundThreeBookThreshold}</dd></div>
                        <div><dt>Round 4 threshold</dt><dd>{defaults.roundFourBookThreshold}</dd></div>
                        <div><dt>Clean to go out</dt><dd>{defaults.cleanBooksRequiredToGoOut}</dd></div>
                        <div><dt>Dirty to go out</dt><dd>{defaults.dirtyBooksRequiredToGoOut}</dd></div>
                    </dl>
                </section>

                <div className="rules-actions">
                    <Button type="submit" variant="primary">Save</Button>
                    <Button type="button" variant="secondary" onClick={handleReset}>Reset to Defaults</Button>
                    <Button type="button" variant="outline-secondary" onClick={handleBack}>
                        {activeGameRoute ? "Back to Active Game" : "Back"}
                    </Button>
                </div>
            </Form>
        </main>
    );
}

export default RulesPage;
