export interface LineChartConfig {
    lineColor?: string;
    showShadow?: boolean;
    gridColor?: string;
    enableAnimation?: boolean;
    animationDuration?: number;
    axisTextColor?: string;
    axisTextSize?: string;
    gridNumberDecimal?: number;
    margin?: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
}
export interface DataPoint {
    x: number;
    y: number;
}
export interface KeyPoint extends DataPoint {
    render: string;
}
export interface KeyTick {
    x: number;
    label: string;
}
export declare const DEFAULT_CONFIG: LineChartConfig;
