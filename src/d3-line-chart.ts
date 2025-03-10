import * as d3 from 'd3';
import { LineChartConfig, DataPoint, KeyPoint, KeyTick, DEFAULT_CONFIG } from './types';
import { rdpAlgorithm, formatLargeNumber, debounce } from './utils';

/**
 * D3折线图Web Component
 */
export class D3LineChart extends HTMLElement {
  // Shadow DOM
  private shadow: ShadowRoot;
  
  // 容器元素
  private container: HTMLDivElement;
  private svgContainer: SVGSVGElement;
  private canvasContainer: HTMLCanvasElement;
  
  // 画布上下文
  private ctx: CanvasRenderingContext2D | null = null;
  
  // 数据和配置
  private data: DataPoint[] = [];
  private keyPoints: KeyPoint[] = [];
  private keyTicks: KeyTick[] = [];
  private config: LineChartConfig = { ...DEFAULT_CONFIG };
  
  // 尺寸和比例尺
  private width: number = 0;
  private height: number = 0;
  private margin = { top: 20, right: 30, bottom: 40, left: 50 };
  private xScale: d3.ScaleLinear<number, number> = d3.scaleLinear();
  private yScale: d3.ScaleLinear<number, number> = d3.scaleLinear();
  
  // 动画相关
  private animationProgress: number = 0;
  private animationId: number | null = null;
  
  // 重绘防抖
  private debouncedResize: () => void;
  
  constructor() {
    super();
    
    // 创建Shadow DOM
    this.shadow = this.attachShadow({ mode: 'open' });
    
    // 创建样式
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      
      .container {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      
      canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      
      svg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
      
      .key-point {
        position: absolute;
        transform: translate(-50%, -50%);
        z-index: 10;
        pointer-events: auto;
      }
    `;
    
    // 创建容器
    this.container = document.createElement('div');
    this.container.className = 'container';
    
    // 创建Canvas
    this.canvasContainer = document.createElement('canvas');
    this.ctx = this.canvasContainer.getContext('2d');
    
    // 创建SVG
    this.svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    
    // 添加元素到Shadow DOM
    this.container.appendChild(this.canvasContainer);
    this.container.appendChild(this.svgContainer);
    this.shadow.appendChild(style);
    this.shadow.appendChild(this.container);
    
    // 初始化防抖重绘函数
    this.debouncedResize = debounce(this.resize.bind(this), 200);
    
    // 监听窗口大小变化
    this.setupResizeObserver();
  }
  
  /**
   * 当元素被添加到DOM时调用
   */
  connectedCallback() {
    this.resize();
  }
  
  /**
   * 当元素从DOM中移除时调用
   */
  disconnectedCallback() {
    // 清除动画
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  /**
   * 设置配置
   * @param config 配置对象
   */
  setConfig(config: Partial<LineChartConfig>) {
    this.config = { ...this.config, ...config };
    this.render();
    return this;
  }
  
  /**
   * 设置是否启用动画
   * @param enable 是否启用
   * @param duration 动画时长（毫秒）
   */
  setEnableAnimation(enable: boolean, duration?: number) {
    this.config.enableAnimation = enable;
    if (duration !== undefined) {
      this.config.animationDuration = duration;
    }
    return this;
  }
  
  /**
   * 设置数据
   * @param data 数据点数组
   */
  setData(data: DataPoint[]) {
    this.data = [...data];
    
    // 重置动画进度
    this.animationProgress = 0;
    
    // 更新比例尺
    this.updateScales();
    
    // 渲染图表
    this.render();
    return this;
  }
  
  /**
   * 设置关键点
   * @param keyPoints 关键点数组
   */
  setKeyPoints(keyPoints: KeyPoint[]) {
    this.keyPoints = [...keyPoints];
    this.render();
    return this;
  }
  
  /**
   * 设置关键刻度点
   * @param keyTicks 关键刻度点数组
   */
  setKeyTicks(keyTicks: KeyTick[]) {
    this.keyTicks = [...keyTicks];
    this.render();
    return this;
  }
  
  /**
   * 获取配置
   */
  getConfig(): LineChartConfig {
    return { ...this.config };
  }
  
  /**
   * 获取是否启用动画
   */
  getEnableAnimation(): boolean {
    return !!this.config.enableAnimation;
  }
  
  /**
   * 获取动画时长
   */
  getAnimationDuration(): number {
    return this.config.animationDuration || DEFAULT_CONFIG.animationDuration!;
  }
  
  /**
   * 获取网格线颜色
   */
  getGridColor(): string {
    return this.config.gridColor || DEFAULT_CONFIG.gridColor!;
  }
  
  /**
   * 获取折线颜色
   */
  getLineColor(): string {
    return this.config.lineColor || DEFAULT_CONFIG.lineColor!;
  }
  
  /**
   * 获取是否显示阴影
   */
  getShowShadow(): boolean {
    return this.config.showShadow !== undefined ? this.config.showShadow : DEFAULT_CONFIG.showShadow!;
  }
  
  /**
   * 获取坐标轴文本颜色
   */
  getAxisTextColor(): string {
    return this.config.axisTextColor || DEFAULT_CONFIG.axisTextColor!;
  }
  
  /**
   * 获取坐标轴文本大小
   */
  getAxisTextSize(): string {
    return this.config.axisTextSize || DEFAULT_CONFIG.axisTextSize!;
  }
  
  /**
   * 获取数据
   */
  getData(): DataPoint[] {
    return [...this.data];
  }
  
  /**
   * 获取关键点
   */
  getKeyPoints(): KeyPoint[] {
    return [...this.keyPoints];
  }
  
  /**
   * 获取关键刻度点
   */
  getKeyTicks(): KeyTick[] {
    return [...this.keyTicks];
  }
  
  /**
   * 设置ResizeObserver监听大小变化
   */
  private setupResizeObserver() {
    // 使用ResizeObserver监听容器大小变化
    const resizeObserver = new ResizeObserver(() => {
      this.debouncedResize();
    });
    
    resizeObserver.observe(this);
    
    // 初始调整大小
    this.resize();
  }
  
  /**
   * 调整大小
   */
  private resize() {
    const rect = this.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    
    // 设置Canvas大小
    this.canvasContainer.width = this.width * window.devicePixelRatio;
    this.canvasContainer.height = this.height * window.devicePixelRatio;
    this.canvasContainer.style.width = `${this.width}px`;
    this.canvasContainer.style.height = `${this.height}px`;
    
    // 调整Canvas缩放
    if (this.ctx) {
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    
    // 更新比例尺
    this.updateScales();
    
    // 重新渲染
    this.render();
  }
  
  /**
   * 更新比例尺
   */
  private updateScales() {
    if (this.data.length === 0) return;
    
    // 计算数据范围
    const xExtent = d3.extent(this.data, d => d.x) as [number, number];
    const yExtent = d3.extent(this.data, d => d.y) as [number, number];
    
    // 设置比例尺
    this.xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([this.margin.left, this.width - this.margin.right]);
    
    this.yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([this.height - this.margin.bottom, this.margin.top]);
  }
  
  /**
   * 渲染图表
   */
  private render() {
    if (!this.ctx || this.data.length === 0) return;
    
    // 清除画布
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // 清除SVG内容
    while (this.svgContainer.firstChild) {
      this.svgContainer.removeChild(this.svgContainer.firstChild);
    }
    
    // 移除所有关键点DOM元素
    const keyPointElements = this.shadow.querySelectorAll('.key-point');
    keyPointElements.forEach(el => el.remove());
    
    // 绘制网格线和坐标轴
    this.drawGridAndAxis();
    
    // 绘制折线
    if (this.config.enableAnimation) {
      this.startAnimation();
    } else {
      this.drawLine(1);
      this.renderKeyPoints();
    }
  }
  
  /**
   * 绘制网格线和坐标轴
   */
  private drawGridAndAxis() {
    // 创建SVG组
    const g = d3.select(this.svgContainer);
    
    // 生成Y轴刻度
    const yTicks = this.yScale.ticks(5);
    
    // 绘制横向网格线（Y轴网格线）
    g.selectAll('.grid-line-y')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-line-y')
      .attr('x1', this.margin.left)
      .attr('x2', this.width - this.margin.right)
      .attr('y1', d => this.yScale(d))
      .attr('y2', d => this.yScale(d))
      .attr('stroke', this.getGridColor())
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-width', 1);
    
    // 绘制Y轴刻度值
    g.selectAll('.y-axis-label')
      .data(yTicks)
      .enter()
      .append('text')
      .attr('class', 'y-axis-label')
      .attr('x', this.margin.left - 10)
      .attr('y', d => this.yScale(d))
      .attr('dy', '0.32em')
      .attr('text-anchor', 'end')
      .attr('fill', this.getAxisTextColor())
      .attr('font-size', this.getAxisTextSize())
      .text(d => formatLargeNumber(d, this.config.gridNumberDecimal || 0));
    
    // 绘制X轴
    g.append('line')
      .attr('class', 'x-axis')
      .attr('x1', this.margin.left)
      .attr('x2', this.width - this.margin.right)
      .attr('y1', this.height - this.margin.bottom)
      .attr('y2', this.height - this.margin.bottom)
      .attr('stroke', this.getGridColor())
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-width', 1);
    
    // 绘制关键刻度点
    if (this.keyTicks.length > 0) {
      g.selectAll('.key-tick')
        .data(this.keyTicks)
        .enter()
        .append('text')
        .attr('class', 'key-tick')
        .attr('x', d => this.xScale(d.x))
        .attr('y', this.height - this.margin.bottom + 20)
        .attr('text-anchor', 'middle')
        .attr('fill', this.getAxisTextColor())
        .attr('font-size', this.getAxisTextSize())
        .text(d => d.label);
    }
  }
  
  /**
   * 绘制折线
   * @param progress 动画进度 (0-1)
   */
  private drawLine(progress: number) {
    if (!this.ctx || this.data.length === 0) return;
    
    // 应用数据抽稀
    const epsilon = 0.5; // 抽稀阈值
    const simplifiedData = rdpAlgorithm(this.data, epsilon);
    
    // 计算动画进度对应的数据点数量
    const dataLength = Math.floor(simplifiedData.length * progress);
    const animatedData = simplifiedData.slice(0, dataLength);
    
    if (animatedData.length < 2) return;
    
    // 绘制折线
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(this.xScale(animatedData[0].x), this.yScale(animatedData[0].y));
    
    for (let i = 1; i < animatedData.length; i++) {
      this.ctx.lineTo(this.xScale(animatedData[i].x), this.yScale(animatedData[i].y));
    }
    
    this.ctx.strokeStyle = this.getLineColor();
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // 绘制阴影
    if (this.getShowShadow()) {
      // 继续路径以闭合区域
      this.ctx.lineTo(this.xScale(animatedData[animatedData.length - 1].x), this.height - this.margin.bottom);
      this.ctx.lineTo(this.xScale(animatedData[0].x), this.height - this.margin.bottom);
      this.ctx.closePath();
      
      // 创建渐变
      const gradient = this.ctx.createLinearGradient(0, this.margin.top, 0, this.height - this.margin.bottom);
      const color = this.getLineColor();
      gradient.addColorStop(0, `${color}80`); // 50% 透明度
      gradient.addColorStop(1, `${color}00`); // 0% 透明度
      
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }
    
    this.ctx.restore();
  }
  
  /**
   * 渲染关键点
   */
  private renderKeyPoints() {
    // 过滤出在坐标范围内的关键点
    const validKeyPoints = this.keyPoints.filter(point => {
      const x = this.xScale(point.x);
      const y = this.yScale(point.y);
      return (
        x >= this.margin.left &&
        x <= this.width - this.margin.right &&
        y >= this.margin.top &&
        y <= this.height - this.margin.bottom
      );
    });
    
    // 为每个关键点创建DOM元素
    validKeyPoints.forEach(point => {
      const keyPointElement = document.createElement('div');
      keyPointElement.className = 'key-point';
      keyPointElement.style.left = `${this.xScale(point.x)}px`;
      keyPointElement.style.top = `${this.yScale(point.y)}px`;
      keyPointElement.innerHTML = point.render;
      
      this.container.appendChild(keyPointElement);
    });
  }
  
  /**
   * 开始动画
   */
  private startAnimation() {
    // 清除之前的动画
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // 重置动画进度
    this.animationProgress = 0;
    
    // 动画开始时间
    const startTime = performance.now();
    const duration = this.getAnimationDuration();
    
    // 动画函数
    const animate = (currentTime: number) => {
      // 计算动画进度
      const elapsed = currentTime - startTime;
      this.animationProgress = Math.min(elapsed / duration, 1);
      
      // 清除画布
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.width, this.height);
      }
      
      // 绘制折线
      this.drawLine(this.animationProgress);
      
      // 如果动画未完成，继续下一帧
      if (this.animationProgress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        // 动画完成，渲染关键点
        this.renderKeyPoints();
        this.animationId = null;
      }
    };
    
    // 开始动画
    this.animationId = requestAnimationFrame(animate);
  }
}

// 注册Web Component
customElements.define('d3-line-chart', D3LineChart);
