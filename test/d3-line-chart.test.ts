import { D3LineChart } from '../src/d3-line-chart';
import { DataPoint, KeyPoint, KeyTick } from '../src/types';

// 模拟d3
jest.mock('d3', () => ({
  scaleLinear: jest.fn().mockImplementation(() => ({
    domain: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    ticks: jest.fn().mockReturnValue([0, 25, 50, 75, 100])
  })),
  extent: jest.fn().mockImplementation((data, accessor) => {
    if (!data || data.length === 0) return [0, 0];
    const values = data.map(accessor);
    return [Math.min(...values), Math.max(...values)];
  }),
  select: jest.fn().mockImplementation(() => ({
    selectAll: jest.fn().mockReturnThis(),
    data: jest.fn().mockReturnThis(),
    enter: jest.fn().mockReturnThis(),
    append: jest.fn().mockReturnThis(),
    attr: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis()
  }))
}));

describe('D3LineChart', () => {
  let chart: D3LineChart;
  let container: HTMLElement;

  beforeEach(() => {
    // 创建容器
    container = document.createElement('div');
    container.style.width = '500px';
    container.style.height = '300px';
    document.body.appendChild(container);

    // 创建图表实例
    chart = document.createElement('d3-line-chart') as D3LineChart;
    container.appendChild(chart);

    // 模拟元素尺寸
    Object.defineProperty(chart, 'getBoundingClientRect', {
      value: jest.fn().mockReturnValue({
        width: 500,
        height: 300
      })
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('应该正确创建Web Component', () => {
    expect(chart).toBeDefined();
    expect(chart.shadowRoot).toBeDefined();
    expect(chart.shadowRoot?.querySelector('.container')).toBeDefined();
    expect(chart.shadowRoot?.querySelector('canvas')).toBeDefined();
    expect(chart.shadowRoot?.querySelector('svg')).toBeDefined();
  });

  test('setConfig方法应该正确设置配置', () => {
    const config = {
      lineColor: '#ff0000',
      showShadow: false,
      gridColor: '#00ff00',
      enableAnimation: false,
      animationDuration: 2000,
      axisTextColor: '#0000ff',
      axisTextSize: '16px',
      gridNumberDecimal: 2
    };

    chart.setConfig(config);

    expect(chart.getConfig()).toEqual(config);
    expect(chart.getLineColor()).toBe('#ff0000');
    expect(chart.getShowShadow()).toBe(false);
    expect(chart.getGridColor()).toBe('#00ff00');
    expect(chart.getEnableAnimation()).toBe(false);
    expect(chart.getAnimationDuration()).toBe(2000);
    expect(chart.getAxisTextColor()).toBe('#0000ff');
    expect(chart.getAxisTextSize()).toBe('16px');
  });

  test('setEnableAnimation方法应该正确设置动画配置', () => {
    chart.setEnableAnimation(true, 3000);
    expect(chart.getEnableAnimation()).toBe(true);
    expect(chart.getAnimationDuration()).toBe(3000);

    chart.setEnableAnimation(false);
    expect(chart.getEnableAnimation()).toBe(false);
    expect(chart.getAnimationDuration()).toBe(3000); // 不应该改变时长
  });

  test('setData方法应该正确设置数据', () => {
    const data: DataPoint[] = [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 15 }
    ];

    chart.setData(data);
    expect(chart.getData()).toEqual(data);
  });

  test('setKeyPoints方法应该正确设置关键点', () => {
    const keyPoints: KeyPoint[] = [
      { x: 1, y: 20, render: '<div>测试</div>' }
    ];

    chart.setKeyPoints(keyPoints);
    expect(chart.getKeyPoints()).toEqual(keyPoints);
  });

  test('setKeyTicks方法应该正确设置关键刻度点', () => {
    const keyTicks: KeyTick[] = [
      { x: 0, label: '开始' },
      { x: 2, label: '结束' }
    ];

    chart.setKeyTicks(keyTicks);
    expect(chart.getKeyTicks()).toEqual(keyTicks);
  });

  test('应该使用默认配置', () => {
    expect(chart.getLineColor()).toBe('#3498db');
    expect(chart.getShowShadow()).toBe(true);
    expect(chart.getGridColor()).toBe('#e0e0e0');
    expect(chart.getEnableAnimation()).toBe(true);
    expect(chart.getAnimationDuration()).toBe(1000);
    expect(chart.getAxisTextColor()).toBe('#333333');
    expect(chart.getAxisTextSize()).toBe('12px');
  });

  test('方法链式调用应该正常工作', () => {
    const result = chart
      .setConfig({ lineColor: '#ff0000' })
      .setData([{ x: 0, y: 10 }])
      .setKeyPoints([{ x: 0, y: 10, render: '<div>测试</div>' }])
      .setKeyTicks([{ x: 0, label: '测试' }])
      .setEnableAnimation(false);

    expect(result).toBe(chart);
  });
});
