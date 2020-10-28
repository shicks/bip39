import gulp from 'gulp';
import closureImport from 'google-closure-compiler';

const closure = closureImport.gulp();

const WEB_SRCS = [
  'bip-encrypt.js',
  'bip-input.js',
  'bip-shares.js',
  'bip-split.js',
  'bip-xor-table.js',
  'codex.js',
  'seed.js',
  'words.js',
];

gulp.task('default', function() {
  return gulp.src(WEB_SRCS, {base: './'})
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
