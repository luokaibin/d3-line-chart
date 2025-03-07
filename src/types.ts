// 折线图配置接口
export interface LineChartConfig {
  lineColor?: string;        // 折线颜色
  showShadow?: boolean;      // 是否显示阴影
  gridColor?: string;        // 网格线颜色
  enableAnimation?: boolean; // 是否启用动画
  animationDuration?: number; // 动画时长
  axisTextColor?: string;    // 坐标轴文本颜色
  axisTextSize?: string;     // 坐标轴文本字体大小
  gridNumberDecimal?: number; // 网格线左侧的刻度值显示几位小数
}

// 数据点接口
export interface DataPoint {
  x: number;
  y: number;
}

// 关键点接口
export interface KeyPoint extends DataPoint {
  render: string; // 关键点的渲染HTML
}

// 关键刻度点接口
export interface KeyTick {
  x: number;
  label: string;
}

// 默认配置
export const DEFAULT_CONFIG: LineChartConfig = {
  lineColor: '#3498db',
  showShadow: true,
  gridColor: '#e0e0e0',
  enableAnimation: true,
  animationDuration: 1000,
  axisTextColor: '#333333',
  axisTextSize: '12px',
  gridNumberDecimal: 0
};
