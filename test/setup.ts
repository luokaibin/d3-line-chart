// 设置测试环境
import '@testing-library/jest-dom';

// 模拟 window.ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// 模拟 window.requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  return setTimeout(() => callback(Date.now()), 0);
};

// 模拟 window.cancelAnimationFrame
global.cancelAnimationFrame = (handle: number): void => {
  clearTimeout(handle);
};

// 模拟 window.devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  value: 1,
  writable: true
});

// 模拟 HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation(() => ({
  clearRect: jest.fn(),
  save: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  closePath: jest.fn(),
  createLinearGradient: jest.fn().mockImplementation(() => ({
    addColorStop: jest.fn()
  })),
  fillStyle: null,
  fill: jest.fn(),
  strokeStyle: null,
  lineWidth: null,
  scale: jest.fn(),
  restore: jest.fn()
}));

// 注册 ResizeObserver
global.ResizeObserver = ResizeObserverMock;
