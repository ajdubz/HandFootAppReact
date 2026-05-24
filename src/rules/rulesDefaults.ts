import Rules from "../models/Rules";

const RULE_DEFAULTS_STORAGE_KEY = "handfoot.rulesDefaults";

export const DEFAULT_RULE_VALUES = {
    cleanBookScore: 500,
    dirtyBookScore: 300,
    redThreeScore: -300,
    pulledScore: 50,
    winnerScore: 100,
    cardsToStart: 11,
    cardsToDraw: 2,
    roundOneBookThreshold: 50,
    roundTwoBookThreshold: 90,
    roundThreeBookThreshold: 120,
    roundFourBookThreshold: 150,
    cleanBooksRequiredToGoOut: 2,
    dirtyBooksRequiredToGoOut: 2,
};

type RuleNumberKey = keyof typeof DEFAULT_RULE_VALUES;

const ruleKeys = Object.keys(DEFAULT_RULE_VALUES) as RuleNumberKey[];
const nonNegativeRuleKeys = new Set<RuleNumberKey>([
    "cleanBookScore",
    "dirtyBookScore",
    "pulledScore",
    "winnerScore",
    "cardsToStart",
    "cardsToDraw",
    "roundOneBookThreshold",
    "roundTwoBookThreshold",
    "roundThreeBookThreshold",
    "roundFourBookThreshold",
    "cleanBooksRequiredToGoOut",
    "dirtyBooksRequiredToGoOut",
]);

const toFiniteNumber = (value: unknown): number | undefined => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const hasAnyRuleValue = (rules?: Partial<Rules>): boolean => {
    if (!rules) {
        return false;
    }

    return ruleKeys.some((key) => {
        const value = toFiniteNumber(rules[key]);
        return value !== undefined && value !== 0;
    });
};

export const buildDefaultRules = (): Rules => Object.assign(new Rules(), DEFAULT_RULE_VALUES);

export const normalizeRules = (rules?: Partial<Rules>): Rules => {
    const baseRules = buildDefaultRules();

    if (!hasAnyRuleValue(rules)) {
        return baseRules;
    }

    ruleKeys.forEach((key) => {
        const value = toFiniteNumber(rules?.[key]);
        if (value !== undefined) {
            if (key === "redThreeScore") {
                baseRules[key] = -Math.abs(value);
            } else {
                baseRules[key] = nonNegativeRuleKeys.has(key) ? Math.max(0, value) : value;
            }
        }
    });

    return baseRules;
};

export const loadRuleDefaults = (): Rules => {
    try {
        const savedDefaults = localStorage.getItem(RULE_DEFAULTS_STORAGE_KEY);
        if (!savedDefaults) {
            return buildDefaultRules();
        }

        return normalizeRules(JSON.parse(savedDefaults) as Partial<Rules>);
    } catch (error) {
        console.error("Error loading rule defaults:", error);
        return buildDefaultRules();
    }
};

export const saveRuleDefaults = (rules: Partial<Rules>): Rules => {
    const normalizedRules = normalizeRules(rules);
    localStorage.setItem(RULE_DEFAULTS_STORAGE_KEY, JSON.stringify(normalizedRules));
    return normalizedRules;
};

export const resetRuleDefaults = (): Rules => {
    localStorage.removeItem(RULE_DEFAULTS_STORAGE_KEY);
    return buildDefaultRules();
};
