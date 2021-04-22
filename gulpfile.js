'use strict';

const fs = require('fs');
const gulp = require('gulp');
const sass = require('gulp-sass');
const { rollup } = require('rollup');
const { babel } = require('@rollup/plugin-babel');
const { terser } = require("rollup-plugin-terser");

gulp.task('scss', () => {
  return gulp.src('src/scss/lazyframe.scss')
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(gulp.dest('dist'));
});

gulp.task('js', () => {
  return rollup({
      input: 'src/lazyframe.js',
      plugins: [
        babel({
          exclude: 'node_modules/**'
        }),
        terser()
      ]
    })
    .then(bundle => {
      return bundle.write({
        file: 'dist/lazyframe.min.js',
        format: 'umd',
        exports: 'default',
        name: 'lazyframe',
        sourcemap: true
      });
    });
});

gulp.task('default', gulp.parallel('scss', 'js'));
