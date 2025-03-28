import { DataPoint } from './types';
/**
 * 计算点到线段的垂直距离
 * @param point 点
 * @param lineStart 线段起点
 * @param lineEnd 线段终点
 * @returns 垂直距离
 */
export declare function perpendicularDistance(point: DataPoint, lineStart: DataPoint, lineEnd: DataPoint): number;
/**
 * Ramer-Douglas-Peucker 算法实现数据抽稀
 * @param points 原始数据点
 * @param epsilon 阈值，越小保留的点越多
 * @returns 抽稀后的数据点
 */
export declare function rdpAlgorithm(points: DataPoint[], epsilon: number): DataPoint[];
/**
 * 基于数据范围的比例计算抽稀阈值
 * @param points 数据点数组
 * @returns 动态计算的抽稀阈值
 */
export declare function calculateEpsilonByRange(points: DataPoint[]): number;
/**
 * 格式化大数字，如50000 -> 50K
 * @param yTicks Y轴刻度值数组
 * @returns 格式化后的对象，键为原始值，值为格式化后的字符串
 */
export declare function formatLargeNumber(yTicks: number[]): Record<number, string>;
/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param delay 延迟时间
 * @returns 防抖处理后的函数
 */
export declare function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
