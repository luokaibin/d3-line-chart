import { DataPoint } from './types';

/**
 * 计算点到线段的垂直距离
 * @param point 点
 * @param lineStart 线段起点
 * @param lineEnd 线段终点
 * @returns 垂直距离
 */
export function perpendicularDistance(point: DataPoint, lineStart: DataPoint, lineEnd: DataPoint): number {
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
export function rdpAlgorithm(points: DataPoint[], epsilon: number): DataPoint[] {
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
  } else {
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
export function formatLargeNumber(value: number, decimal: number = 0): string {
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(decimal) + 'M';
  } else if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(decimal) + 'K';
  } else {
    return value.toFixed(decimal);
  }
}

/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param delay 延迟时间
 * @returns 防抖处理后的函数
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: number | null = null;
  
  return function(this: any, ...args: Parameters<T>): void {
    if (timer !== null) {
      window.clearTimeout(timer);
    }
    
    timer = window.setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}
