/*eslint-env node*/
'use strict';

// Gulp plugins
var gulp = require('gulp'),
    eslint = require('gulp-eslint'),
    gutil = require('gulp-util'),

    sequence = require('run-sequence'),
    path = require('path'),

    ping = require('ping'),
    watcher = require('./lib/file-watch'),
    perl = require('./lib/perl'),

    config = require('./config');

/**
 * File watch and trigger build of:
 * 		* JavaScript
 * 		* CSS/LESS
 * 		* Perl
 */
gulp.task('watch', ['scripts', 'styles', 'perl']);

/**
 * CSS/LESS
 */
gulp.task('styles', ['is-online'], function () {
    return watcher(['/**/Data/Public/**/*.css', '/**/Data/Public/**/*.less'], function (source, dist, copyToShared) {
        gulp.src(source)
            .pipe(copyToShared);
    });
});

/**
 * Javascript
 */
gulp.task('scripts', ['is-online'], function () {
    return watcher('/**/Data/Public/**/*.js', function (source, dist, copyToShared) {
        gulp.src(source)
            // Linting
            .pipe(eslint())
            .pipe(eslint.format())
            .pipe(copyToShared);
    });
});

/**
 * Perl
 */
gulp.task('perl', ['is-online'], function () {
    return watcher(['/**/*.pm', '/**/*.pl', '/**/*.t'], function (source) {
        var remoteFile = source
            .replace(config['cartridges-local'], config['cartridges-remote'])
            .replace(path.sep, '/');

        return perl.lint(remoteFile);
    });
});

/**
 * epages 6 controls
 */
gulp.task('is-online', function (done) {
    ping.sys.probe(config['vm-domain'], function (isAlive) {
        if (isAlive) {
            return done();
        }
        gutil.log(gutil.colors.red('VM ' + config['vm-domain'] + ' seems to be offline'));
    });
});

gulp.task('init', ['is-online'], perl.reinstall);

gulp.task('build', ['is-online'], perl.build);

/**
 * Default task including:
 * 		* build
 * 		* watch
 */
gulp.task('default', function (done) {
    sequence('build', 'watch', done);
});
