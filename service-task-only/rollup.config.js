import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

import path from 'path';

export default [
  {
    input: path.join(__dirname, 'src/index.js'),
    output: {
      file: path.join(__dirname, '../dist/service-task-only.umd.js'),
      format: 'umd',
      name: 'BpmnJSServiceTaskOnly'
    },
    plugins: [
      nodeResolve(),
      commonjs()
    ]
  }
];