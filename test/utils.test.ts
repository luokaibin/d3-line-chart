import { rdpAlgorithm, perpendicularDistance, formatLargeNumber, debounce } from '../src/utils';
import { DataPoint } from '../src/types';

describe('工具函数测试', () => {
  describe('perpendicularDistance', () => {
    test('计算点到水平线的垂直距离', () => {
      const point: DataPoint = { x: 5, y: 3 };
      const lineStart: DataPoint = { x: 0, y: 0 };
      const lineEnd: DataPoint = { x: 10, y: 0 };
      
      expect(perpendicularDistance(point, lineStart, lineEnd)).toBe(3);
    });
    
    test('计算点到垂直线的垂直距离', () => {
      const point: DataPoint = { x: 3, y: 5 };
      const lineStart: DataPoint = { x: 0, y: 0 };
      const lineEnd: DataPoint = { x: 0, y: 10 };
      
      expect(perpendicularDistance(point, lineStart, lineEnd)).toBe(3);
    });
    
    test('计算点到斜线的垂直距离', () => {
      const point: DataPoint = { x: 0, y: 0 };
      const lineStart: DataPoint = { x: 0, y: 1 };
      const lineEnd: DataPoint = { x: 1, y: 0 };
      
      // 计算点(0,0)到线段(0,1)-(1,0)的垂直距离
      // 线段方程为 y = -x + 1
      // 点到直线距离为 |ax + by + c| / sqrt(a^2 + b^2)
      // 其中 a = 1, b = 1, c = -1
      // 距离 = |1*0 + 1*0 - 1| / sqrt(1^2 + 1^2) = 1 / sqrt(2) ≈ 0.7071
      
      expect(perpendicularDistance(point, lineStart, lineEnd)).toBeCloseTo(0.7071, 4);
    });
  });
  
  describe('rdpAlgorithm', () => {
    test('当点数少于3时应该返回原始点', () => {
      const points: DataPoint[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 }
      ];
      
      expect(rdpAlgorithm(points, 1)).toEqual(points);
    });
    
    test('当最大距离小于阈值时应该只返回首尾两点', () => {
      const points: DataPoint[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0.1 }, // 这个点距离直线很近
        { x: 2, y: 0 }
      ];
      
      expect(rdpAlgorithm(points, 0.2)).toEqual([
        { x: 0, y: 0 },
        { x: 2, y: 0 }
      ]);
    });
    
    test('当最大距离大于阈值时应该保留关键点', () => {
      const points: DataPoint[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 }, // 这个点距离直线较远
        { x: 2, y: 0 }
      ];
      
      expect(rdpAlgorithm(points, 0.5)).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 0 }
      ]);
    });
    
    test('复杂数据抽稀', () => {
      const points: DataPoint[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0.1 }, // 距离直线近，应该被移除
        { x: 2, y: 0.2 }, // 距离直线近，应该被移除
        { x: 3, y: 3 },   // 距离直线远，应该保留
        { x: 4, y: 0.4 }, // 距离直线近，应该被移除
        { x: 5, y: 0.5 }, // 距离直线近，应该被移除
        { x: 6, y: 0 }
      ];
      
      const result = rdpAlgorithm(points, 0.5);
      
      // 应该保留首尾两点和中间的关键点
      expect(result).toContainEqual({ x: 0, y: 0 });
      expect(result).toContainEqual({ x: 3, y: 3 });
      expect(result).toContainEqual({ x: 6, y: 0 });
      expect(result.length).toBe(3);
    });
  });
  
  describe('formatLargeNumber', () => {
    test('格式化千位数', () => {
      expect(formatLargeNumber(1500)).toBe('1.5K');
      expect(formatLargeNumber(1500, 1)).toBe('1.5K');
      expect(formatLargeNumber(1500, 2)).toBe('1.50K');
    });
    
    test('格式化百万位数', () => {
      expect(formatLargeNumber(1500000)).toBe('1.5M');
      expect(formatLargeNumber(1500000, 1)).toBe('1.5M');
      expect(formatLargeNumber(1500000, 2)).toBe('1.50M');
    });
    
    test('格式化小数', () => {
      expect(formatLargeNumber(123.456, 0)).toBe('123');
      expect(formatLargeNumber(123.456, 1)).toBe('123.5');
      expect(formatLargeNumber(123.456, 2)).toBe('123.46');
    });
    
    test('格式化负数', () => {
      expect(formatLargeNumber(-1500)).toBe('-1.5K');
      expect(formatLargeNumber(-1500000)).toBe('-1.5M');
    });
  });
  
  describe('debounce', () => {
    jest.useFakeTimers();
    
    test('应该延迟函数执行', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 1000);
      
      debouncedFn();
      expect(mockFn).not.toBeCalled();
      
      jest.advanceTimersByTime(1000);
      expect(mockFn).toBeCalledTimes(1);
    });
    
    test('多次调用应该只执行一次', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 1000);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(mockFn).not.toBeCalled();
      
      jest.advanceTimersByTime(1000);
      expect(mockFn).toBeCalledTimes(1);
    });
    
    test('应该使用最后一次调用的参数', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 1000);
      
      debouncedFn(1);
      debouncedFn(2);
      debouncedFn(3);
      
      jest.advanceTimersByTime(1000);
      expect(mockFn).toBeCalledWith(3);
    });
  });
});
