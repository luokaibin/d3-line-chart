import { LineChartConfig, DataPoint, KeyPoint, KeyTick } from './types';
/**
 * D3折线图Web Component
 */
export declare class D3LineChart extends HTMLElement {
    private shadow;
    private container;
    private svgContainer;
    private canvasContainer;
    private ctx;
    private data;
    private keyPoints;
    private keyTicks;
    private config;
    private width;
    private height;
    private margin;
    private xScale;
    private yScale;
    private animationProgress;
    private animationId;
    private debouncedResize;
    constructor();
    /**
     * 当元素被添加到DOM时调用
     */
    connectedCallback(): void;
    /**
     * 当元素从DOM中移除时调用
     */
    disconnectedCallback(): void;
    /**
     * 设置配置
     * @param config 配置对象
     */
    setConfig(config: Partial<LineChartConfig>): this;
    /**
     * 获取margin配置
     */
    getMargin(): {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    /**
     * 设置是否启用动画
     * @param enable 是否启用
     * @param duration 动画时长（毫秒）
     */
    setEnableAnimation(enable: boolean, duration?: number): this;
    /**
     * 设置数据
     * @param data 数据点数组
     */
    setData(data: DataPoint[]): this;
    /**
     * 设置关键点
     * @param keyPoints 关键点数组
     */
    setKeyPoints(keyPoints: KeyPoint[]): this;
    /**
     * 设置关键刻度点
     * @param keyTicks 关键刻度点数组
     */
    setKeyTicks(keyTicks: KeyTick[]): this;
    /**
     * 获取配置
     */
    getConfig(): LineChartConfig;
    /**
     * 获取是否启用动画
     */
    getEnableAnimation(): boolean;
    /**
     * 获取动画时长
     */
    getAnimationDuration(): number;
    /**
     * 获取网格线颜色
     */
    getGridColor(): string;
    /**
     * 获取折线颜色
     */
    getLineColor(): string;
    /**
     * 获取是否显示阴影
     */
    getShowShadow(): boolean;
    /**
     * 获取坐标轴文本颜色
     */
    getAxisTextColor(): string;
    /**
     * 获取坐标轴文本大小
     */
    getAxisTextSize(): string;
    /**
     * 获取数据
     */
    getData(): DataPoint[];
    /**
     * 获取关键点
     */
    getKeyPoints(): KeyPoint[];
    /**
     * 获取关键刻度点
     */
    getKeyTicks(): KeyTick[];
    /**
     * 获取曲线类型
     */
    getCurveType(): 'linear' | 'curve';
    /**
     * 设置ResizeObserver监听大小变化
     */
    private setupResizeObserver;
    /**
     * 调整大小
     */
    private resize;
    /**
     * 更新比例尺
     */
    private updateScales;
    /**
     * 渲染图表
     */
    private render;
    /**
     * 绘制网格线和坐标轴
     */
    private drawGridAndAxis;
    /**
     * 绘制折线
     * @param progress 动画进度 (0-1)
     */
    private drawLine;
    /**
     * 绘制直线折线
     * @param progress 动画进度 (0-1)
     */
    private drawLinearLine;
    /**
     * 绘制曲线折线
     * @param progress 动画进度 (0-1)
     */
    private drawCurveLine;
    /**
     * 渲染关键点
     */
    private renderKeyPoints;
    /**
     * 开始动画
     */
    private startAnimation;
}
