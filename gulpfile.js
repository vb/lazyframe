const gulp = require('gulp'),
  rollup = require('rollup'),
  sass = require('gulp-sass'),
  babel = require('rollup-plugin-babel'),
  uglify = require('rollup-plugin-uglify'),
  del = require('del'),
  fs = require('fs');

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
        moduleName: 'lazyframe',
      });
      fs.appendFileSync('dist/lazyframe.min.js', files.code);
    });
});

gulp.task('build', ['scss', 'js']);
gulp.task('clean', () => del('dist/**/*.js'));
gulp.task('default', ['build']);
