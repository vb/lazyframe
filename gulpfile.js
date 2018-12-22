'use strict';

const fs = require('fs');
const gulp = require('gulp');
const sass = require('gulp-sass');
const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const uglify = require('rollup-plugin-uglify');

gulp.task('scss', () => {
  return gulp.src('src/scss/lazyframe.scss')
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(gulp.dest('dist'));
});

gulp.task('js', () => {
  return rollup
    .rollup({
      entry: 'src/lazyframe.js',
      plugins: [
        babel({
          exclude: 'node_modules/**'
        }),
        uglify()
      ]
    })
    .then(bundle => {
      const files = bundle.generate({
        format: 'umd',
        exports: 'default',
        moduleName: 'lazyframe'
      });

      fs.writeFileSync('dist/lazyframe.min.js', files.code);
    });
});

gulp.task('default', gulp.parallel('scss', 'js'));
