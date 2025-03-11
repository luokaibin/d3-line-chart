var D3LineChart = (function (exports, d3) {
    'use strict';

    function _interopNamespaceDefault(e) {
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () { return e[k]; }
                    });
                }
            });
        }
        n.default = e;
        return Object.freeze(n);
    }

    var d3__namespace = /*#__PURE__*/_interopNamespaceDefault(d3);

    // 默认配置
    const DEFAULT_CONFIG = {
        lineColor: '#3498db',
        showShadow: true,
        gridColor: '#e0e0e0',
        enableAnimation: true,
        animationDuration: 1000,
        axisTextColor: '#333333',
        axisTextSize: '12px',
        gridNumberDecimal: 0
    };

    /**
     * 计算点到线段的垂直距离
     * @param point 点
     * @param lineStart 线段起点
     * @param lineEnd 线段终点
     * @returns 垂直距离
     */
    function perpendicularDistance(point, lineStart, lineEnd) {
        if (lineStart.x === lineEnd.x) {
            return Math.abs(point.x - lineStart.x);
        }
        const slope = (lineEnd.y - lineStart.y) / (lineEnd.x - lineStart.x);
        const intercept = lineStart.y - (slope * lineStart.x);
        // 点到直线的距离公式: |ax + by + c| / sqrt(a^2 + b^2)
        // 其中直线方程为 ax + by + c = 0
        // 转换为 y = mx + b 形式，则 a = -m, b = 1, c = -b
        const a = -slope;
        const b = 1;
        const c = -intercept;
        return Math.abs(a * point.x + b * point.y + c) / Math.sqrt(a * a + b * b);
    }
    /**
     * Ramer-Douglas-Peucker 算法实现数据抽稀
     * @param points 原始数据点
     * @param epsilon 阈值，越小保留的点越多
     * @returns 抽稀后的数据点
     */
    function rdpAlgorithm(points, epsilon) {
        if (points.length <= 2) {
            return [...points];
        }
        // 找到距离最远的点
        let maxDistance = 0;
        let maxIndex = 0;
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        for (let i = 1; i < points.length - 1; i++) {
            const distance = perpendicularDistance(points[i], firstPoint, lastPoint);
            if (distance > maxDistance) {
                maxDistance = distance;
                maxIndex = i;
            }
        }
        // 如果最大距离大于阈值，则递归处理
        if (maxDistance > epsilon) {
            const leftPoints = rdpAlgorithm(points.slice(0, maxIndex + 1), epsilon);
            const rightPoints = rdpAlgorithm(points.slice(maxIndex), epsilon);
            // 合并结果，避免重复点
            return [...leftPoints.slice(0, -1), ...rightPoints];
        }
        else {
            // 如果最大距离小于阈值，则只保留首尾两点
            return [firstPoint, lastPoint];
        }
    }
    /**
     * 格式化大数字，如50000 -> 50K
     * @param value 数值
     * @param decimal 小数位数
     * @returns 格式化后的字符串
     */
    function formatLargeNumber(value, decimal = 0) {
        if (Math.abs(value) >= 1000000) {
            return (value / 1000000).toFixed(decimal) + 'M';
        }
        else if (Math.abs(value) >= 1000) {
            return (value / 1000).toFixed(decimal) + 'K';
        }
        else {
            return value.toFixed(decimal);
        }
    }
    /**
     * 防抖函数
     * @param fn 要执行的函数
     * @param delay 延迟时间
     * @returns 防抖处理后的函数
     */
    function debounce(fn, delay) {
        let timer = null;
        return function (...args) {
            if (timer !== null) {
                window.clearTimeout(timer);
            }
            timer = window.setTimeout(() => {
                fn.apply(this, args);
                timer = null;
            }, delay);
        };
    }

    /**
     * D3折线图Web Component
     */
    class D3LineChart extends HTMLElement {
        constructor() {
            super();
            // 画布上下文
            this.ctx = null;
            // 数据和配置
            this.data = [];
            this.keyPoints = [];
            this.keyTicks = [];
            this.config = { ...DEFAULT_CONFIG };
            // 尺寸和比例尺
            this.width = 0;
            this.height = 0;
            this.margin = { top: 20, right: 30, bottom: 40, left: 50 };
            this.xScale = d3__namespace.scaleLinear();
            this.yScale = d3__namespace.scaleLinear();
            // 动画相关
            this.animationProgress = 0;
            this.animationId = null;
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
        setConfig(config) {
            this.config = { ...this.config, ...config };
            this.render();
            return this;
        }
        /**
         * 设置是否启用动画
         * @param enable 是否启用
         * @param duration 动画时长（毫秒）
         */
        setEnableAnimation(enable, duration) {
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
        setData(data) {
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
        setKeyPoints(keyPoints) {
            this.keyPoints = [...keyPoints];
            this.render();
            return this;
        }
        /**
         * 设置关键刻度点
         * @param keyTicks 关键刻度点数组
         */
        setKeyTicks(keyTicks) {
            this.keyTicks = [...keyTicks];
            this.render();
            return this;
        }
        /**
         * 获取配置
         */
        getConfig() {
            return { ...this.config };
        }
        /**
         * 获取是否启用动画
         */
        getEnableAnimation() {
            return !!this.config.enableAnimation;
        }
        /**
         * 获取动画时长
         */
        getAnimationDuration() {
            return this.config.animationDuration || DEFAULT_CONFIG.animationDuration;
        }
        /**
         * 获取网格线颜色
         */
        getGridColor() {
            return this.config.gridColor || DEFAULT_CONFIG.gridColor;
        }
        /**
         * 获取折线颜色
         */
        getLineColor() {
            return this.config.lineColor || DEFAULT_CONFIG.lineColor;
        }
        /**
         * 获取是否显示阴影
         */
        getShowShadow() {
            return this.config.showShadow !== undefined ? this.config.showShadow : DEFAULT_CONFIG.showShadow;
        }
        /**
         * 获取坐标轴文本颜色
         */
        getAxisTextColor() {
            return this.config.axisTextColor || DEFAULT_CONFIG.axisTextColor;
        }
        /**
         * 获取坐标轴文本大小
         */
        getAxisTextSize() {
            return this.config.axisTextSize || DEFAULT_CONFIG.axisTextSize;
        }
        /**
         * 获取数据
         */
        getData() {
            return [...this.data];
        }
        /**
         * 获取关键点
         */
        getKeyPoints() {
            return [...this.keyPoints];
        }
        /**
         * 获取关键刻度点
         */
        getKeyTicks() {
            return [...this.keyTicks];
        }
        /**
         * 设置ResizeObserver监听大小变化
         */
        setupResizeObserver() {
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
        resize() {
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
        updateScales() {
            if (this.data.length === 0)
                return;
            // 计算数据范围
            const xExtent = d3__namespace.extent(this.data, d => d.x);
            const yExtent = d3__namespace.extent(this.data, d => d.y);
            // 设置比例尺
            this.xScale = d3__namespace.scaleLinear()
                .domain(xExtent)
                .range([this.margin.left, this.width - this.margin.right]);
            this.yScale = d3__namespace.scaleLinear()
                .domain(yExtent)
                .range([this.height - this.margin.bottom, this.margin.top]);
        }
        /**
         * 渲染图表
         */
        render() {
            if (!this.ctx || this.data.length === 0)
                return;
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
            }
            else {
                this.drawLine(1);
                this.renderKeyPoints();
            }
        }
        /**
         * 绘制网格线和坐标轴
         */
        drawGridAndAxis() {
            // 创建SVG组
            const g = d3__namespace.select(this.svgContainer);
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
        drawLine(progress) {
            if (!this.ctx || this.data.length === 0)
                return;
            // 应用数据抽稀
            const epsilon = 0.5; // 抽稀阈值
            const simplifiedData = rdpAlgorithm(this.data, epsilon);
            // 计算动画进度对应的数据点数量
            const dataLength = Math.floor(simplifiedData.length * progress);
            const animatedData = simplifiedData.slice(0, dataLength);
            if (animatedData.length < 2)
                return;
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
        renderKeyPoints() {
            // 过滤出在坐标范围内的关键点
            const validKeyPoints = this.keyPoints.filter(point => {
                const x = this.xScale(point.x);
                const y = this.yScale(point.y);
                return (x >= this.margin.left &&
                    x <= this.width - this.margin.right &&
                    y >= this.margin.top &&
                    y <= this.height - this.margin.bottom);
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
        startAnimation() {
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
            const animate = (currentTime) => {
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
                }
                else {
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

    exports.D3LineChart = D3LineChart;

    return exports;

})({}, d3);
//# sourceMappingURL=d3-line-chart.js.map
