'use strict';

const babel = require('rollup-plugin-babel');
const { uglify } = require('rollup-plugin-uglify');

module.exports = {
  input: './src/lazyframe.js',
  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),
    uglify()
  ],
  output: {
    file: './dist/lazyframe.min.js',
    format: 'umd',
    exports: 'default',
    name: 'lazyframe'
  }
};
