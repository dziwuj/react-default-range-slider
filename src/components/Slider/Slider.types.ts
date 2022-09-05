export interface Simple {
    min: number;
    max: number;
}

export interface Output {
    value: string;
    valueIndex: number;
}

export interface SliderProps {
    hasSteps?: boolean;
    tooltipVisibility?: "always" | "hover" | "never";
    tooltipPosition?: "under" | "over";
    value: Simple | (number | string)[];
    start?: number | string;
    formatter?: (value: number | string) => string;
    onChange: (value: Output) => void;
}
