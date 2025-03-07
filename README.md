# 使用D3.js开发一个web component的折线图组件

## 业务需求
1. 不显示纵向网格线和纵向坐标轴
2. 横向网格线和坐标轴显示为虚线，可自定义颜色
3. 横向网格线在左侧显示刻度值
4. 横向坐标轴只在关键刻度点显示刻度值
5. 横向坐标轴的刻度线不显示
6. 折线可以定义颜色，并且折线下方有阴影，**阴影由浓转淡再消失**
7. 折线的关键点可以定义特殊样式
8. 折线的绘制有从左往右的绘制动画

## 名词解释
- 纵向网格线：x轴的网格线
- 横向网格线：y轴的网格线
- 纵向坐标轴：Y轴的坐标轴，即竖着的坐标轴
- 横向坐标轴：X轴的坐标轴，即横着的坐标轴
- 刻度值：坐标轴上的数字
- 刻度线：坐标轴上指向刻度值的线
- 刻度点：坐标轴上的点，例如横向坐标轴有【1，2，3，4，5】，那么刻度点就是【1，2，3，4，5】
- 关键刻度点：刻度点中的一部分，例如横向坐标轴有【1，2，3，4，5】，那么关键刻度点可以设置为【3】，那么在3这个刻度点会显示刻度值
- 关键刻度点显示内容：关键刻度点显示的内容，例如可以设置为"关键点"
- 折线图的关键点：要在折线图上显示的点，例如：X轴的刻度点为【1，2，3，4，5】，Y轴的刻度点为【10，20，30，40，50】，那么折线图的关键点可以设置为(2,20)，那么折线图的(2,20)这个点会显示折线图的关键点，注意：关键点并不一定在折线上

## 技术需求
1. 使用D3.js v7.9.0版本，D3的API文档为：https://d3js.org/what-is-d3，D3的script脚本地址使用CDN的形式，url为：https://cdn.jsdelivr.net/npm/d3@7
2. 纵向的网格线和纵向的坐标轴不显示，固定写死，不需要进行配置
3. 横向的网格线和坐标轴固定显示为虚线，不需要配置；但是横向的网格线可以自定义颜色
4. 横向的网格线在左侧需要显示刻度值，刻度值为数字，对于大数字需要显示为50K、100K等形式；默认不显示小数，直接取整，但是可以配置显示几位小数；
5. 横向坐标轴只在关键刻度点显示刻度值，例如横向坐标轴有[1,2,3,4,5]个刻度点，**那么可以设置3为关键刻度点，并且可以设置关键刻度点显示的内容，例如显示为"关键点"**
6. 横向网格线左侧的刻度值(A)和横向坐标轴的刻度值(B)可以配置文本颜色和字体大小，这两个配置项统一，不需要给A和B单独的配置
7. 横向坐标轴的刻度线不显示，固定写死，不需要进行配置
8. 折线可以配置颜色；折线下方有阴影，阴影由浓转淡再消失，可以配置是否显示阴影；
9. 折线的关键点由外部传入dom元素，外部进行渲染，例如外部可以传入，render字段，render字段的值为: `<div style="border: 2px solid #3498db;border-radius: 50%;width: 30px;height: 30px;overflow: hidden;"><img src="https://opensocial.co/img/whatever.webp" style="width:100%;height:100%;" /></div>`;但是内部承载render的父元素，不要限制内部的宽高
10. 如果设置的关键在超出了折线图，则不进行渲染。例如：X轴的刻度点为【1，2，3，4，5】，Y轴的刻度点为【10，20，30，40，50】，而设置的关键点是(2,100)，那么就超出了这个坐标轴上的显示范围，则不进行显示
11. 折线图的绘制动画，即从左往右的绘制动画，可以配置动画开启与否；同时需要可以配置动画时长
12. 渲染使用canvas + SVG混合的渲染方式，使用Canvas绘制折线图主体，使用SVG绘制其他元素，例如网格线、坐标轴等，例如折线的关键点是传入的dom元素，那么需要在SVG中渲染这个dom元素就比在canvas中处理要方便的中，总的来说需要发挥canvas和svg各自的优势
13. 由于折线图的渲染使用canvas + SVG混合的渲染方式，所以需要确保Canvas和SVG使用相同的坐标系统，在缩放或调整大小时同步更新
14. 由于折线图的数据点比较多，所以需要在内部实现数据抽稀算法以提高性能，抽稀算法使用Ramer-Douglas-Peucker算法
15. web Component内的元素，即Shadow DOM的宽高为100%，即它的宽高由外部决定，它本身是能撑多大就撑多大
16. 折线图的大小需要自适应，即由于它父元素的宽高变化，它自身也会随着变化,自适应由webComponent组件内部自行处理
17. 横向网格线左侧的刻度值需要配置是否显示小数，可以配置显示几位小数
18. 不需要特别考虑浏览器兼容性
19. 项目结构为单文件组件，使用rollup对这个文件进行打包压缩
20. 提供一个演示页面，用于展示折线图的使用方法
21. 演示页面可以使用http-server进行启动，http-server已经全局安装了
22. 包管理工具使用pnpm
23. 使用typescript进行开发
24. 添加单元测试

## API和数据结构设计
1. web component的名称为：d3-line-chart，它的实例称为chart
2. chart需要对外提供setConfig方法，用于设置折线图的配置，setConfig的使用如下
    ```javascript
    chart.setConfig({
      lineColor: '#3498db', // 配置折线的颜色
      showShadow: true, // 配置是否显示阴影
      gridColor: '#ff0000', // 配置网格线的颜色
      enableAnimation: true, // 配置是否启用动画
      animationDuration: 1000, // 配置动画时长
      axisTextColor: '#f00', // 配置坐标轴文本颜色
      axisTextSize: '14px', // 配置坐标轴文本字体大小
      gridNumberDecimal: 2, // 配置网格线左侧的刻度值显示几位小数
    });
    ```
3. chart需要对外提供setEnableAnimation方法，用于设置是否启用动画，它接收两个参数，第一个参数表示是否启用动画，第二个参数表示动画的时长，第二个参数可选，默认为1秒钟，setEnableAnimation的使用如下
    ```javascript
    chart.setEnableAnimation(true, 1000); // 启用动画，动画时长为1秒
    chart.setEnableAnimation(false); // 禁用动画
    ```
4. chart需要对外提供setData方法，用于设置折线图的数据，setData的使用如下
    ```javascript
    chart.setData([
      { x: 0, y: 10 },
      { x: 1, y: 15 },
      { x: 2, y: 8 },
      // ...
    ]);
    ```
5. chart需要对外提供setKeyPoints方法，用于设置折线图的关键点，setKeyPoints的使用如下
    ```javascript
    chart.setKeyPoints([
      { x: 1, y: 15, render: `<div style="border: 2px solid #3498db;border-radius: 50%;width: 30px;height: 30px;overflow: hidden;"><img src="https://opensocial.co/img/whatever.webp" style="width:100%;height:100%;" /></div>` },
      { x: 3, y: 20, render: `<div style="border: 2px solid #3498db;border-radius: 50%;width: 30px;height: 30px;overflow: hidden;"><img src="https://opensocial.co/img/whatever.webp" style="width:100%;height:100%;" /></div>` },
      // ...
    ]);
    ```
6. chart需要对外提供setKeyTicks方法，用于设置折线图的关键刻度点，setKeyTicks的使用如下
    ```javascript
    chart.setKeyTicks([
      { x: 0, label: '开始' },
      { x: 10, label: '10%' },
      { x: 25, label: '25%' },
      { x: 50, label: '中点' }
    ]);
    ```
7. chart需要对外提供getConfig、getEnableAnimation、getData、getKeyPoints、getKeyTicks、getAnimationDuration、getGridColor、getLineColor、getShowShadow、getAxisTextColor、getAxisTextSize等方法，用于获取折线图的配置

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
| `gridNumberDecimal` | number | 0 | 网格线左侧的刻度值显示几位小数 |

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
| `getShowShadow` | - | `boolean` | 获取是否显示阴影 |
| `getAxisTextColor` | - | `string` | 获取坐标轴文本颜色 |
| `getAxisTextSize` | - | `string` | 获取坐标轴文本大小 |

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

// 设置小数位数（例如，显示为"1.25M"而不是"1M"）
chart.setConfig({
  gridNumberDecimal: 2
});
```

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