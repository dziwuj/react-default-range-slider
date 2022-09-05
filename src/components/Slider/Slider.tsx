import React, { useState, useEffect, useRef } from "react";
import { SliderProps, Output } from "./Slider.types";

import "./Slider.scss";

const range = (start: number, end: number, step: number) => {
    return Array.from(Array.from(Array(Math.ceil((end - start) / step)).keys()), (x) => start + x * step);
};

const Slider: React.FC<SliderProps> = ({ hasSteps, tooltipVisibility, tooltipPosition, value, onChange, start, formatter }) => {
    const values = value instanceof Array ? value : Array.from(range(value.min, value.max + 1, 1));
    const startPoint = start ? (values.indexOf(start) === -1 ? 0 : values.indexOf(start)) : 0;
    const format = formatter ? formatter : (x: string | number) => `${x}`;

    const [min, setMin] = useState<Output>({
        value: format(values[startPoint]),
        valueIndex: startPoint,
    });

    if (!tooltipVisibility) tooltipVisibility = "always";
    const [left, setLeft] = useState<number | null>(null);
    const [track, setTrack] = useState<{ width: number } | null>(null);
    const [visibility, setVisibility] = useState<"visible" | "hidden">(tooltipVisibility === "always" ? "visible" : "hidden");
    const [currentMousePosition, setCurrentMousePosition] = useState<number>(0);
    const [moving, setMoving] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const railRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const ballRef = useRef<HTMLDivElement>(null);
    const [minLimit, setMinLimit] = useState<number | null>(null);
    const [maxLimit, setMaxLimit] = useState<number | null>(null);
    const [lastMoved, setLastMoved] = useState<HTMLDivElement | null>(null);
    const [startX, setStartX] = useState<number | null>(null);
    const [ballSize, setBallSize] = useState<number | null>(null);
    const [currLeft, setCurrLeft] = useState<number | null>(null);
    const [update, setUpdate] = useState<"jumpTo" | "move" | null>(null);
    const firstRender = useRef<boolean>(true);
    const outputRef = React.useRef<Output | null>(null);

    function init() {
        if (ballRef.current && railRef.current) {
            setBallSize(ballRef.current.clientWidth);
            setMinLimit(ballRef.current.clientWidth / -2);
            setMaxLimit(Number(window.getComputedStyle(railRef.current).width.replace("px", "")) - ballRef.current.clientWidth / 2);
            setLeft(
                (Number(window.getComputedStyle(railRef.current!).width.replace("px", "")) / (values.length - 1)) * startPoint - ballRef.current.clientWidth / 2
            );
        }

        const trackWidth = (Number(window.getComputedStyle(railRef.current!).width.replace("px", "")) / (values.length - 1)) * startPoint;

        if (trackRef.current)
            setTrack({
                width: trackWidth,
            });
    }

    function cancel() {
        outputRef.current && onChange(outputRef.current);
        setStartX(null);
        setMoving(false);
        if (tooltipVisibility === "hover") setVisibility("hidden");
    }

    function updateSize() {
        init();
    }

    useEffect(() => {
        document.addEventListener("mousemove", (e) => {
            setCurrentMousePosition(e.clientX);
        });
        window.addEventListener("resize", updateSize);

        init();
        setUpdate(null);
        return () => {
            window.removeEventListener("resize", updateSize);
        };
    }, []);

    useEffect(() => {
        if (firstRender.current) return;
        // console.log(left);
        if (track && tooltipRef.current && containerRef.current && ballSize && left) {
            if (
                left - tooltipRef.current.clientWidth / 2 + ballSize / 2 <
                Number(window.getComputedStyle(containerRef.current).marginLeft.replace("px", "")) * -1
            ) {
                tooltipRef.current.style.left = `${
                    Number(window.getComputedStyle(containerRef.current).marginLeft.replace("px", "")) * -1 - left + tooltipRef.current.clientWidth / 2
                }px`;
                tooltipRef.current.style.setProperty("--after-left", `0`);
                tooltipRef.current.style.setProperty("--after-margin-left", `${Math.abs(left + tooltipRef.current.clientWidth / 2 - ballSize / 1.5)}px`);
                console.log("lewo");
            } else if (
                left + tooltipRef.current.clientWidth / 2 + ballSize / 2 >
                Number(window.getComputedStyle(containerRef.current).marginRight.replace("px", "")) + containerRef.current.clientWidth
            ) {
                tooltipRef.current.style.left = `${
                    Number(window.getComputedStyle(containerRef.current).marginRight.replace("px", "")) +
                    containerRef.current.clientWidth -
                    (left + tooltipRef.current.clientWidth / 2)
                }px`;
                tooltipRef.current.style.setProperty("--after-left", `0`);
                tooltipRef.current.style.setProperty(
                    "--after-margin-left",
                    `${left + tooltipRef.current.clientWidth - ballSize / 1.5 - containerRef.current.clientWidth}px`
                );
            } else {
                tooltipRef.current.style.left = "50%";
                tooltipRef.current.style.setProperty("--after-left", `50%`);
                tooltipRef.current.style.setProperty("--after-margin-left", `-10px`);
            }
        }
        if (left !== null && ballSize) setTrack({ width: left + ballSize / 2 });

        if (update) updateValue();
    }, [update]);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        outputRef.current = { value: min.value, valueIndex: min.valueIndex };
        if (update === "jumpTo") onChange(outputRef.current);
    }, [min.value]);

    useEffect(() => {
        if (!moving) return;
        if (startX && lastMoved && minLimit && maxLimit && ballSize && currLeft !== null && railRef.current && left !== null) {
            const delta = currentMousePosition - startX;
            const newPosition = (currLeft ? currLeft : 0) + delta;
            const step = Math.round(newPosition / (Number(window.getComputedStyle(railRef.current!).width.replace("px", "")) / (values.length - 1)));
            const newStepPosition = (Number(window.getComputedStyle(railRef.current!).width.replace("px", "")) / (values.length - 1)) * step - ballSize / 2;

            if (hasSteps) {
                if (newStepPosition >= minLimit && newStepPosition <= maxLimit) setLeft(newStepPosition);
            } else {
                if (newPosition >= minLimit && newPosition <= maxLimit) setLeft(newPosition);
            }
            if (tooltipVisibility !== "never") setVisibility("visible");
            setUpdate("move");
        }
    }, [currentMousePosition]);

    const jumpTo = (e: React.MouseEvent<HTMLDivElement>) => {
        if (ballRef.current && ballSize && minLimit && maxLimit && left !== null) {
            const newPosition = ballRef.current.offsetLeft + (e.clientX - ballRef.current.getBoundingClientRect().left) - ballSize / 2;
            const step = Math.round(newPosition / (Number(window.getComputedStyle(railRef.current!).width.replace("px", "")) / (values.length - 1)));
            const newStepPosition = (Number(window.getComputedStyle(railRef.current!).width.replace("px", "")) / (values.length - 1)) * step - ballSize / 2;

            if (hasSteps) {
                if (newStepPosition >= minLimit && newStepPosition <= maxLimit) setLeft(newStepPosition);
            } else {
                if (newPosition >= minLimit && newPosition <= maxLimit) setLeft(newPosition);
            }
            setUpdate("jumpTo");
        }
    };

    const updateValue = () => {
        if (railRef.current && trackRef.current && ballSize && ballRef.current) {
            const marks = Number(window.getComputedStyle(railRef.current).width.replace("px", "")) / values.length;
            let leftValue = Number(window.getComputedStyle(ballRef.current).left.replace("px", ""));
            leftValue =
                leftValue > Number(window.getComputedStyle(railRef.current).width.replace("px", ""))
                    ? Number(window.getComputedStyle(railRef.current).width.replace("px", "")) + ballSize / 2
                    : leftValue + ballSize / 2;
            leftValue = leftValue <= 0 ? 0 : leftValue;
            let index = Math.floor(leftValue / marks);
            index >= values.length ? (index = values.length - 1) : index;

            const stringValue = typeof values[index] === "string" ? values[index] : values[index].toString();

            setMin({ value: format(stringValue), valueIndex: index });
        }
        setUpdate(null);
    };

    return (
        <div className="default-slider-container" ref={containerRef}>
            <div className="default-slider-rail" ref={railRef} onClick={jumpTo}>
                {hasSteps &&
                    values.map((value, index) => {
                        return (
                            railRef.current &&
                            index > 0 &&
                            index < values.length - 1 && (
                                <div
                                    key={index}
                                    className="default-slider-step"
                                    style={{
                                        left: `${
                                            (Number(window.getComputedStyle(railRef.current).width.replace("px", "")) / (values.length - 1)) * index - 2.5
                                        }px`,
                                    }}
                                ></div>
                            )
                        );
                    })}
            </div>
            <div
                className="default-slider-track"
                ref={trackRef}
                style={track ? { left: `0`, width: `${track.width}px` } : undefined}
                onMouseOver={() => {
                    if (tooltipVisibility === "hover") setVisibility("hidden");
                }}
                onMouseOut={() => {
                    if (tooltipVisibility === "hover") setVisibility("hidden");
                }}
                onClick={jumpTo}
            ></div>
            <div
                className={`default-slider-min default-slider-ball${lastMoved === ballRef.current ? " default-slider-active" : ""}`}
                style={{ left: `${(left! / railRef.current?.clientWidth!) * 100}%` }}
                ref={ballRef}
                onMouseOver={() => {
                    if (tooltipVisibility === "hover") setVisibility("visible");
                }}
                onMouseOut={() => {
                    if (tooltipVisibility === "hover") setVisibility("hidden");
                }}
                onMouseDown={(e) => {
                    setStartX(currentMousePosition);
                    setLastMoved(ballRef.current);
                    setCurrLeft(left);
                    setMoving(true);
                    document.addEventListener("mouseup", cancel, { once: true });
                }}
            >
                <div
                    className={`default-slider-tooltip ${tooltipPosition ? `default-slider-${tooltipPosition}` : "default-slider-over"}`}
                    style={{ visibility: visibility }}
                    ref={tooltipRef}
                >
                    <p className="default-slider-min-text-holder default-slider-text-holder">{min.value}</p>
                </div>
            </div>
        </div>
    );
};
export default Slider;
