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
        transform: translateX(-50%);
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
    
    // 更新margin配置
    if (config.margin) {
      this.margin = {
        top: config.margin.top !== undefined ? config.margin.top : this.margin.top,
        right: config.margin.right !== undefined ? config.margin.right : this.margin.right,
        bottom: config.margin.bottom !== undefined ? config.margin.bottom : this.margin.bottom,
        left: config.margin.left !== undefined ? config.margin.left : this.margin.left
      };
    }
    
    this.render();
    return this;
  }
  
  /**
   * 获取margin配置
   */
  getMargin(): { top: number; right: number; bottom: number; left: number } {
    return { ...this.margin };
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
   * 获取曲线类型
   */
  getCurveType(): 'linear' | 'curve' {
    return this.config.curveType || DEFAULT_CONFIG.curveType!;
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
    
    // 调整Y轴比例尺
    this.extendYScaleDomain();
    
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
   * 扩展Y轴比例尺域，以便更好地显示数据
   */
  private extendYScaleDomain(): void {
    // 生成Y轴刻度
    let yTicks = this.yScale.ticks(this.getTickCount());
    
    // 计算刻度间距并添加一个额外的更小刻度
    if (yTicks.length >= 2) {
      // 对刻度进行排序（从小到大）
      yTicks.sort((a, b) => a - b);
      
      // 获取数据的最小值
      const dataMin = d3.min(this.data, d => d.y) || 0;
      
      // 只有当最小刻度值大于数据的最小值时，才进行扩展
      if (yTicks[0] > dataMin) {
        // 计算最小的刻度间距
        const minTickDiff = yTicks[1] - yTicks[0];
        
        // 创建一个比最小刻度更小的刻度
        const extraTick = yTicks[0] - minTickDiff;
        
        // 调整domain，使其包含extraTick
        const currentDomain = this.yScale.domain();
        this.yScale.domain([extraTick, currentDomain[1]]);
      }
    }
  }
  
  /**
   * 获取刻度数量
   */
  private getTickCount(): number {
    return this.config.tickCount || DEFAULT_CONFIG.tickCount || 5;
  }
  
  /**
   * 绘制网格线和坐标轴
   */
  private drawGridAndAxis() {
    // 清除之前的元素
    d3.select(this.svgContainer).selectAll('*').remove();
    
    const g = d3.select(this.svgContainer);
    
    // 使用已调整好的比例尺生成刻度
    let yTicks = this.yScale.ticks(this.getTickCount());
    // 格式化刻度值
    const formattedTicksMap = formatLargeNumber(yTicks);
    
    // 测量文本宽度的临时SVG文本元素
    const tempText = g.append('text')
      .attr('class', 'temp-text')
      .attr('font-size', this.getAxisTextSize())
      .style('visibility', 'hidden');
    
    // 计算格式化后的数字宽度
    const getTextWidth = (text: string): number => {
      tempText.text(text);
      return (tempText.node() as SVGTextElement)?.getBBox().width || 0;
    };
    
    // 计算最大宽度
    const formattedValues = Object.values(formattedTicksMap);
    const maxWidth = Math.max(...formattedValues.map(getTextWidth));

    // 计算新的左侧边距（文本宽度 + margin.left + 10）
    const newLeftMargin = this.margin.left + maxWidth + 10;

    // 移除临时文本元素
    tempText.remove();

    // 绘制横向网格线（Y轴网格线）
    g.selectAll('.grid-line-y')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-line-y')
      .attr('x1', newLeftMargin)
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
      .attr('x', newLeftMargin -10) // 根据文本宽度调整位置
      .attr('y', d => this.yScale(d))
      .attr('dy', '0.32em')
      .attr('text-anchor', 'end')
      .attr('fill', this.getAxisTextColor())
      .attr('font-size', this.getAxisTextSize())
      .text(d => formattedTicksMap[d]);
    
    // 绘制X轴（与额外添加的最小刻度对齐）
    g.append('line')
      .attr('class', 'x-axis')
      .attr('x1', newLeftMargin)
      .attr('x2', this.width - this.margin.right)
      .attr('y1', this.yScale(yTicks[0])) // 使用新添加的最小刻度
      .attr('y2', this.yScale(yTicks[0])) // 使用新添加的最小刻度
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
        .attr('y', this.yScale(yTicks[0]) + 20) // 将关键刻度点放在X轴下方20像素处
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
    
    // 根据配置选择绘制方式
    if (this.getCurveType() === 'curve') {
      this.drawCurveLine(progress);
    } else {
      this.drawLinearLine(progress);
    }
  }
  
  /**
   * 绘制直线折线
   * @param progress 动画进度 (0-1)
   */
  private drawLinearLine(progress: number) {
    if (!this.ctx || this.data.length === 0) return;
    
    // 获取当前的左侧边距
    const g = d3.select(this.svgContainer);
    const xAxisLine = g.select('.x-axis');
    let leftMargin = this.margin.left;
    
    // 如果已经设置了新的左侧边距，则使用它
    if (xAxisLine.attr('x1')) {
      leftMargin = parseFloat(xAxisLine.attr('x1'));
    }
    
    // 应用数据抽稀
    const epsilon = 0.6; // 抽稀阈值
    const simplifiedData = rdpAlgorithm(this.data, epsilon);
    
    // 计算动画进度对应的数据点数量
    const dataLength = Math.floor(simplifiedData.length * progress);
    const animatedData = simplifiedData.slice(0, dataLength);
    
    if (animatedData.length < 2) return;
    
    // 创建新的比例尺，使用调整后的左侧边距
    const adjustedXScale = d3.scaleLinear()
      .domain([d3.min(this.data, d => d.x) || 0, d3.max(this.data, d => d.x) || 0])
      .range([leftMargin, this.width - this.margin.right]);
    
    // 绘制折线
    this.ctx.save();
    this.ctx.beginPath();
    
    this.ctx.moveTo(adjustedXScale(animatedData[0].x), this.yScale(animatedData[0].y));
    
    for (let i = 1; i < animatedData.length; i++) {
      this.ctx.lineTo(adjustedXScale(animatedData[i].x), this.yScale(animatedData[i].y));
    }
    
    this.ctx.strokeStyle = this.getLineColor();
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // 绘制阴影
    if (this.getShowShadow()) {
      // 继续路径以闭合区域
      this.ctx.lineTo(adjustedXScale(animatedData[animatedData.length - 1].x), this.height - this.margin.bottom);
      this.ctx.lineTo(adjustedXScale(animatedData[0].x), this.height - this.margin.bottom);
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
   * 绘制曲线折线
   * @param progress 动画进度 (0-1)
   */
  private drawCurveLine(progress: number) {
    if (!this.ctx || this.data.length === 0) return;
    
    // 获取当前的左侧边距
    const g = d3.select(this.svgContainer);
    const xAxisLine = g.select('.x-axis');
    let leftMargin = this.margin.left;
    
    // 如果已经设置了新的左侧边距，则使用它
    if (xAxisLine.attr('x1')) {
      leftMargin = parseFloat(xAxisLine.attr('x1'));
    }
    
    // 应用数据抽稀
    const epsilon = 0.6; // 抽稀阈值
    const simplifiedData = rdpAlgorithm(this.data, epsilon);
    
    // 计算动画进度对应的数据点数量
    const dataLength = Math.floor(simplifiedData.length * progress);
    const animatedData = simplifiedData.slice(0, dataLength);
    
    if (animatedData.length < 2) return;
    
    // 创建新的比例尺，使用调整后的左侧边距
    const adjustedXScale = d3.scaleLinear()
      .domain([d3.min(this.data, d => d.x) || 0, d3.max(this.data, d => d.x) || 0])
      .range([leftMargin, this.width - this.margin.right]);
    
    // 使用D3的line生成器和曲线插值器
    const line = d3.line<DataPoint>()
      .x(d => adjustedXScale(d.x))
      .y(d => this.yScale(d.y))
      .curve(d3.curveCatmullRom.alpha(0.5)); // 使用CatmullRom曲线，alpha控制曲线张力
    
    // 获取路径数据
    const pathData = line(animatedData);
    
    if (!pathData) return;
    
    // 绘制曲线
    this.ctx.save();
    this.ctx.beginPath();
    
    // 使用路径数据绘制
    const path = new Path2D(pathData);
    this.ctx.strokeStyle = this.getLineColor();
    this.ctx.lineWidth = 2;
    this.ctx.stroke(path);
    
    // 绘制阴影
    if (this.getShowShadow()) {
      this.ctx.beginPath();
      
      // 创建一个新的路径用于填充阴影区域
      const areaPath = new Path2D(pathData);
      
      // 添加闭合区域的路径
      areaPath.lineTo(adjustedXScale(animatedData[animatedData.length - 1].x), this.height - this.margin.bottom);
      areaPath.lineTo(adjustedXScale(animatedData[0].x), this.height - this.margin.bottom);
      areaPath.closePath();
      
      // 创建渐变
      const gradient = this.ctx.createLinearGradient(0, this.margin.top, 0, this.height - this.margin.bottom);
      const color = this.getLineColor();
      gradient.addColorStop(0, `${color}80`); // 50% 透明度
      gradient.addColorStop(1, `${color}00`); // 0% 透明度
      
      this.ctx.fillStyle = gradient;
      this.ctx.fill(areaPath);
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
      
      // 计算X轴位置
      const xAxisY = this.height - this.margin.bottom;
      
      // 获取数据点的Y坐标
      const pointY = this.yScale(point.y);
      
      // 创建临时元素来测量尺寸
      const tempElement = document.createElement('div');
      tempElement.className = 'key-point';
      tempElement.innerHTML = point.render;
      tempElement.style.position = 'absolute';
      tempElement.style.visibility = 'hidden';
      this.container.appendChild(tempElement);
      
      // 获取元素尺寸
      const elementHeight = tempElement.offsetHeight;
      const elementWidth = tempElement.offsetWidth;
      
      // 移除临时元素
      this.container.removeChild(tempElement);
      
      // 计算关键点的X坐标
      const pointX = this.xScale(point.x);
      
      // 检查是否会超出右边界（考虑到transform: translateX(-50%)的影响，实际宽度是elementWidth/2）
      const rightEdgePosition = pointX + elementWidth / 2;
      const isExceedingRightBoundary = rightEdgePosition > (this.width - this.margin.right);
      
      // 调整X位置，确保不超出右边界
      let leftPosition = pointX;
      if (isExceedingRightBoundary) {
        // 将元素右对齐到右边界
        leftPosition = this.width - this.margin.right - elementWidth / 2;
      }
      
      // 设置左侧位置
      keyPointElement.style.left = `${leftPosition}px`;
      
      // 定义接近X轴的阈值（例如：距离X轴不到元素高度的2倍）
      const proximityThreshold = elementHeight * 2;
      
      // 判断点是否靠近X轴
      const isCloseToXAxis = (xAxisY - pointY) < proximityThreshold;
      
      // 计算top位置
      let topPosition;

      if (isCloseToXAxis) {
        // 如果靠近X轴，将关键点显示在数据点上方
        topPosition = pointY - elementHeight;
        
        // 确保不超出上边界
        if (topPosition < this.margin.top) {
          topPosition = this.margin.top;
        }
      } else {
        // 如果不靠近X轴，保持在数据点位置
        topPosition = pointY - 20;
      }

      // 设置top位置
      keyPointElement.style.top = `${topPosition}px`;
      
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
