// 折线图配置接口
export interface LineChartConfig {
  lineColor?: string;        // 折线颜色
  showShadow?: boolean;      // 是否显示阴影
  gridColor?: string;        // 网格线颜色
  enableAnimation?: boolean; // 是否启用动画
  animationDuration?: number; // 动画时长
  axisTextColor?: string;    // 坐标轴文本颜色
  axisTextSize?: string;     // 坐标轴文本字体大小
  margin?: {                 // 图表边距
    top?: number;            // 上边距
    right?: number;          // 右边距
    bottom?: number;         // 下边距
    left?: number;           // 左边距
  };
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
  margin: {
    top: 20,
    right: 30,
    bottom: 40,
    left: 50
  }
};
