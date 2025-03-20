# D3折线图Web Component使用说明

本文档提供了关于如何使用D3折线图Web Component (`d3-line-chart`) 的详细说明，包括安装、配置、API说明以及使用示例。

## 目录

- [安装](#安装)
- [基本用法](#基本用法)
- [API文档](#api文档)
  - [配置选项](#配置选项)
  - [方法](#方法)
  - [数据结构](#数据结构)
- [高级用法](#高级用法)
  - [关键点设置](#关键点设置)
  - [关键刻度点设置](#关键刻度点设置)
  - [动画控制](#动画控制)
  - [大数值处理](#大数值处理)
  - [自定义边距](#自定义边距)
- [性能优化](#性能优化)
- [浏览器兼容性](#浏览器兼容性)
- [常见问题](#常见问题)

## 安装

### 通过NPM安装

```bash
# 使用npm
npm install d3-line-chart

# 使用pnpm
pnpm add d3-line-chart

# 使用yarn
yarn add d3-line-chart
```

### 直接引入

您也可以直接通过script标签引入：

```html
<!-- 引入D3.js -->
<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>

<!-- 引入d3-line-chart -->
<script src="path/to/d3-line-chart.min.js"></script>
```

## 基本用法

### HTML中使用

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
  <script src="path/to/d3-line-chart.min.js"></script>
  <style>
    #chart-container {
      width: 800px;
      height: 400px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div id="chart-container">
    <d3-line-chart id="my-chart"></d3-line-chart>
  </div>

  <script>
    // 获取图表实例
    const chart = document.getElementById('my-chart');
    
    // 设置数据
    chart.setData([
      { x: 0, y: 10 },
      { x: 1, y: 15 },
      { x: 2, y: 8 },
      { x: 3, y: 20 },
      { x: 4, y: 12 }
    ]);
    
    // 设置配置
    chart.setConfig({
      lineColor: '#3498db',
      showShadow: true,
      gridColor: '#e0e0e0'
    });
  </script>
</body>
</html>
```

### 在框架中使用

#### React

```jsx
import React, { useEffect, useRef } from 'react';
import 'path/to/d3-line-chart.min.js';

function LineChartComponent() {
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (chartRef.current) {
      // 设置数据
      chartRef.current.setData([
        { x: 0, y: 10 },
        { x: 1, y: 15 },
        { x: 2, y: 8 }
      ]);
      
      // 设置配置
      chartRef.current.setConfig({
        lineColor: '#3498db',
        showShadow: true
      });
    }
  }, []);
  
  return (
    <div style={{ width: '100%', height: '400px' }}>
      <d3-line-chart ref={chartRef}></d3-line-chart>
    </div>
  );
}

export default LineChartComponent;
```

#### Vue

```vue
<template>
  <div class="chart-container">
    <d3-line-chart ref="chart"></d3-line-chart>
  </div>
</template>

<script>
export default {
  name: 'LineChartComponent',
  mounted() {
    // 确保组件已注册
    if (typeof window.customElements.get('d3-line-chart') === 'undefined') {
      import('path/to/d3-line-chart.min.js');
    }
    
    // 设置数据
    this.$refs.chart.setData([
      { x: 0, y: 10 },
      { x: 1, y: 15 },
      { x: 2, y: 8 }
    ]);
    
    // 设置配置
    this.$refs.chart.setConfig({
      lineColor: '#3498db',
      showShadow: true
    });
  }
}
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 400px;
}
</style>
```

## API文档

### 配置选项

通过`setConfig`方法可以设置以下配置选项：

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `lineColor` | string | '#3498db' | 折线的颜色 |
| `showShadow` | boolean | true | 是否显示折线下方的阴影 |
| `gridColor` | string | '#e0e0e0' | 网格线的颜色 |
| `enableAnimation` | boolean | true | 是否启用动画 |
| `animationDuration` | number | 1000 | 动画时长（毫秒） |
| `axisTextColor` | string | '#333333' | 坐标轴文本颜色 |
| `axisTextSize` | string | '12px' | 坐标轴文本大小 |
| `curveType` | string | 'linear' | 折线类型，可选值：'linear'（直线）或'curve'（曲线） |
| `margin` | object | {top: 20, right: 30, bottom: 40, left: 50} | 图表边距，用于控制图表内容与容器边缘的距离 |
| `tickCount` | number | 5 | Y轴刻度数量 |

### 方法

| 方法 | 参数 | 返回值 | 描述 |
|------|------|--------|------|
| `setConfig` | `config: object` | `this` | 设置图表配置 |
| `setData` | `data: Array<{x: number, y: number}>` | `this` | 设置图表数据 |
| `setKeyPoints` | `keyPoints: Array<{x: number, y: number, render: string}>` | `this` | 设置折线图的关键点 |
| `setKeyTicks` | `keyTicks: Array<{x: number, label: string}>` | `this` | 设置折线图的关键刻度点 |
| `setEnableAnimation` | `enable: boolean, duration?: number` | `this` | 设置是否启用动画及动画时长 |
| `getConfig` | - | `object` | 获取当前配置 |
| `getData` | - | `Array<{x: number, y: number}>` | 获取当前数据 |
| `getKeyPoints` | - | `Array<{x: number, y: number, render: string}>` | 获取当前关键点 |
| `getKeyTicks` | - | `Array<{x: number, label: string}>` | 获取当前关键刻度点 |
| `getEnableAnimation` | - | `boolean` | 获取是否启用动画 |
| `getAnimationDuration` | - | `number` | 获取动画时长 |
| `getGridColor` | - | `string` | 获取网格线颜色 |
| `getLineColor` | - | `string` | 获取折线颜色 |
| `getCurveType` | - | `string` | 获取折线类型（'linear'或'curve'） |
| `getAxisTextColor` | - | `string` | 获取坐标轴文本颜色 |
| `getAxisTextSize` | - | `string` | 获取坐标轴文本大小 |
| `getMargin` | - | `{top: number, right: number, bottom: number, left: number}` | 获取图表边距配置 |
| `getShowShadow` | - | `boolean` | 获取是否显示阴影 |
| `getTickCount` | - | `number` | 获取Y轴刻度数量 |

### 数据结构

#### 数据点

```typescript
interface DataPoint {
  x: number;  // X坐标
  y: number;  // Y坐标
}
```

#### 关键点

```typescript
interface KeyPoint {
  x: number;    // X坐标
  y: number;    // Y坐标
  render: string; // 关键点的渲染HTML
}
```

#### 关键刻度点

```typescript
interface KeyTick {
  x: number;    // X坐标
  label: string; // 刻度点显示的文本
}
```

## 高级用法

### 关键点设置

关键点允许在折线上的特定位置显示自定义的HTML内容：

```javascript
chart.setKeyPoints([
  { 
    x: 2, 
    y: 15, 
    render: `<div style="border: 2px solid #3498db; border-radius: 50%; width: 30px; height: 30px; overflow: hidden;">
      <img src="https://example.com/image.jpg" style="width:100%; height:100%;" />
    </div>` 
  },
  { 
    x: 4, 
    y: 25, 
    render: `<div style="background-color: #e74c3c; color: white; padding: 5px; border-radius: 3px;">
      重要点
    </div>` 
  }
]);
```

### 关键刻度点设置

关键刻度点允许在X轴上的特定位置显示自定义文本：

```javascript
chart.setKeyTicks([
  { x: 0, label: '开始' },
  { x: 2, label: '中间点' },
  { x: 4, label: '结束' }
]);
```

### 动画控制

您可以控制折线图的动画效果：

```javascript
// 启用动画，设置动画时长为2秒
chart.setEnableAnimation(true, 2000);

// 禁用动画
chart.setEnableAnimation(false);
```

### 大数值处理

当处理大数值时，组件会自动将数值格式化为更易读的形式（如10K、1M等）：

```javascript
// 生成大数值数据
const largeData = [];
for (let i = 0; i < 10; i++) {
  largeData.push({
    x: i,
    y: Math.random() * 1000000 // 大数值
  });
}

// 设置数据
chart.setData(largeData);

```

### 自定义边距

您可以通过设置`margin`配置来自定义图表的边距，这对于适应不同的显示需求非常有用：

```javascript
// 设置自定义边距
chart.setConfig({
  margin: {
    top: 30,    // 上边距
    right: 40,  // 右边距
    bottom: 50, // 下边距
    left: 60    // 左边距
  }
});
```

边距配置对于以下场景特别有用：
- 当坐标轴标签较长时，增加左边距和下边距
- 当图表需要更多的顶部空间来显示标题或注释时
- 当需要在不同尺寸的容器中保持一致的视觉效果时

## 性能优化

### 数据抽稀

组件内部使用Ramer-Douglas-Peucker算法进行数据抽稀，以提高渲染性能。对于大量数据点的情况，这种优化是自动进行的，无需手动配置。

### 渲染优化

组件使用Canvas绘制折线和阴影，使用SVG绘制网格线、坐标轴和关键点，充分发挥两种技术的优势，提高渲染性能。

### 响应式设计

组件会自动监听容器大小变化并调整图表尺寸，使用了防抖处理以避免频繁重绘导致的性能问题。

## 浏览器兼容性

组件使用现代Web技术（Web Components、Canvas、SVG等），兼容所有主流现代浏览器：

- Chrome 60+
- Firefox 63+
- Safari 10.1+
- Edge 79+

## 常见问题

### 图表不显示

1. 确保引入了D3.js库
2. 确保容器元素有明确的宽高设置
3. 检查是否正确设置了数据

### 关键点不显示

1. 确保关键点的坐标在图表的可见范围内
2. 检查render字段的HTML是否有语法错误

### 大数值显示问题

如果大数值显示不够精确，可以通过`gridNumberDecimal`配置项调整小数位数：

```javascript
chart.setConfig({
  gridNumberDecimal: 2 // 显示2位小数
});
```

### 自定义样式

如果需要更多样式自定义，可以使用CSS变量或直接修改组件内部样式：

```css
d3-line-chart {
  --line-color: #3498db;
  --grid-color: #e0e0e0;
  --axis-text-color: #333333;
}
```

---

如有更多问题或建议，请参考示例代码或联系开发团队。
