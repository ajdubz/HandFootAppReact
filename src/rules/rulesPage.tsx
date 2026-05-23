import React, { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Rules from "../models/Rules";
import { buildDefaultRules, loadRuleDefaults, normalizeRules, resetRuleDefaults, saveRuleDefaults } from "./rulesDefaults";
import "./rulesPage.css";

type RuleField = {
    key: keyof Rules;
    label: string;
    help: string;
};

const scoringFields: RuleField[] = [
    { key: "cleanBookScore", label: "Clean book", help: "Points for each clean book." },
    { key: "dirtyBookScore", label: "Dirty book", help: "Points for each dirty book." },
    { key: "redThreeScore", label: "Red 3 penalty", help: "Saved as a negative penalty even if entered positive." },
    { key: "pulledScore", label: "Pulled correct", help: "Points per player who pulled correctly." },
    { key: "winnerScore", label: "Went out", help: "Bonus for the team that goes out." },
];

const dealFields: RuleField[] = [
    { key: "cardsToStart", label: "Cards to start", help: "Saved for table setup before a new game." },
    { key: "cardsToDraw", label: "Cards to draw", help: "Saved for table setup before a new game." },
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
        navigate(getPlayerDetailsRoute());
    };

    const renderField = (field: RuleField) => (
        <Form.Group className="rules-field" controlId={`rules-${String(field.key)}`} key={String(field.key)}>
            <Form.Label>{field.label}</Form.Label>
            <Form.Control
                aria-describedby={`rules-${String(field.key)}-help`}
                onChange={(event) => updateRule(field.key, event.target.value)}
                step="1"
                type="number"
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
                    </dl>
                </section>

                <div className="rules-actions">
                    <Button type="submit" variant="primary">Save</Button>
                    <Button type="button" variant="secondary" onClick={handleReset}>Reset to Defaults</Button>
                    <Button type="button" variant="outline-secondary" onClick={handleBack}>Back</Button>
                </div>
            </Form>
        </main>
    );
}

export default RulesPage;
