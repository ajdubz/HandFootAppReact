import React from "react";
import { Button, Form } from "react-bootstrap";
import "./NumericStepper.css";

type NumericStepperProps = {
    ariaDescribedBy?: string;
    ariaLabel: string;
    className?: string;
    controlClassName?: string;
    clampInputMax?: boolean;
    max?: number;
    min?: number;
    onChange: (value: string) => void;
    placeholder?: string;
    showSteppers?: boolean;
    step?: number;
    value: number | string;
};

const clampNumericValue = (value: number, min?: number, max?: number): number => {
    const minClampedValue = min === undefined ? value : Math.max(min, value);
    return max === undefined ? minClampedValue : Math.min(max, minClampedValue);
};

export const normalizeNumericInputValue = (value: string, min?: number, max?: number): string => {
    const trimmedValue = value.trim();

    if (trimmedValue === "") {
        return "";
    }

    if (["-", "+", ".", "-.", "+."].includes(trimmedValue)) {
        return value;
    }

    const numericValue = Number(trimmedValue);
    if (!Number.isFinite(numericValue)) {
        return value;
    }

    return String(clampNumericValue(numericValue, min, max));
};

const stepNumericValue = (value: number | string, step: number, min?: number, max?: number): string => {
    const numericValue = Number(value);
    const nextValue = (Number.isFinite(numericValue) ? numericValue : 0) + step;
    return String(clampNumericValue(nextValue, min, max));
};

function NumericStepper({
    ariaDescribedBy,
    ariaLabel,
    className = "",
    clampInputMax = true,
    controlClassName = "",
    max,
    min,
    onChange,
    placeholder = "0",
    showSteppers = true,
    step = 1,
    value,
}: NumericStepperProps) {
    const displayValue = value === undefined || value === null ? "" : String(value);

    const selectInputValue = (input: HTMLInputElement) => {
        window.requestAnimationFrame(() => {
            input.select();
        });
    };

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
        selectInputValue(event.currentTarget);
    };

    const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
        selectInputValue(event.currentTarget);
    };

    return (
        <div className={`numeric-stepper ${showSteppers ? "" : "numeric-stepper-plain"} ${className}`.trim()}>
            {showSteppers && (
                <Button
                    aria-label={`Decrease ${ariaLabel}`}
                    className="numeric-stepper-button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onChange(stepNumericValue(displayValue, -step, min, max))}
                    type="button"
                    variant="outline-secondary"
                >
                    -
                </Button>
            )}
            <Form.Control
                aria-describedby={ariaDescribedBy}
                aria-label={ariaLabel}
                className={`numeric-stepper-control ${controlClassName}`.trim()}
                inputMode="numeric"
                max={max}
                min={min}
                onClick={handleClick}
                onChange={(event) => onChange(normalizeNumericInputValue(event.target.value, min, clampInputMax ? max : undefined))}
                onFocus={handleFocus}
                onMouseUp={(event) => event.preventDefault()}
                placeholder={placeholder}
                step={step}
                type="number"
                value={displayValue}
            />
            {showSteppers && (
                <Button
                    aria-label={`Increase ${ariaLabel}`}
                    className="numeric-stepper-button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onChange(stepNumericValue(displayValue, step, min, max))}
                    type="button"
                    variant="outline-secondary"
                >
                    +
                </Button>
            )}
        </div>
    );
}

export default NumericStepper;
