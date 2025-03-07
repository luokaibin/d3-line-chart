import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/d3-line-chart.js',
      format: 'umd',
      name: 'D3LineChart',
      globals: {
        'd3': 'd3'
      },
      sourcemap: true
    },
    {
      file: 'dist/d3-line-chart.min.js',
      format: 'umd',
      name: 'D3LineChart',
      globals: {
        'd3': 'd3'
      },
      plugins: [terser()],
      sourcemap: true
    }
  ],
  plugins: [
    nodeResolve(),
    typescript({
      tsconfig: './tsconfig.json'
    })
  ],
  external: ['d3']
};
