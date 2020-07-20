const gulp = require('gulp');
const closure = require('google-closure-compiler').gulp();

const SRCS = [
  'bip-encrypt.js',
  'bip-input.js',
  'bip-shares.js',
  'bip-split.js',
  'bip-xor-table.js',
  'codex.js',
  'index.js',
  'seed.js',
  'words.js',
];

gulp.task('default', function() {
  return gulp.src(SRCS, {base: './'})
      .pipe(closure({
        compilation_level: 'SIMPLE',
        warning_level: 'VERBOSE',
        language_in: 'ECMASCRIPT_2018',
        language_out: 'ECMASCRIPT6_STRICT',
        isolation_mode: 'IIFE',
        js_output_file: 'bip39.min.js',
        module_resolution: 'WEBPACK',
      }, {
        platform: ['native', 'java', 'javascript'],
      }))
      .pipe(gulp.dest('./'));
});
