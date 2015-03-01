'use strict';
/**
 * User: david.losert
 * Date: 07.01.2015
 * Time: 14:48
 */
var gulp = require('gulp'),
    path = require('path'),
    uglify = require('gulp-uglifyjs'),
    plugins = require('gulp-load-plugins')(),
    handlebars = require('gulp-handlebars'),
    wrap = require('gulp-wrap'),
    declare = require('gulp-declare'),
    concat = require('gulp-concat'),
    mainBowerFiles = require('main-bower-files'),
    merge = require('merge-stream');


var CONSTANTS = {
    GADGET_BASE: '../src/main/resources'
};


gulp.task('serve', ['compile:javascript', 'compile:bower', 'compile:css', 'compile:handlebars', 'watch:all'], function () {
    console.log('Compiled all Files and am now Watching...');
    console.log('Open your local Jira Instance under http://localhost:2990/jira - after a change, you must reload there with Shift + F5');
});

gulp.task('watch:all', function () {
    gulp.watch('./scripts/**/*.js', ['compile:javascript']);
    gulp.watch('./bower_components/**/*', ['compile:bower']);
    gulp.watch('./css/**/*.css', ['compile:css']);
    gulp.watch('./templates/**/*.hbs', ['compile:handlebars']);
});


gulp.task('compile:handlebars', function () {
    var partials = gulp.src(['./templates/**/_*.hbs'])
        .pipe(handlebars())
        .pipe(wrap('Handlebars.registerPartial(<%= processPartialName(file.relative) %>, Handlebars.template(<%= contents %>));', {}, {
            imports: {
                processPartialName: function(fileName) {
                    // Strip the extension and the underscore
                    // Escape the output with JSON.stringify
                    return JSON.stringify(path.basename(fileName, '.js').substr(1));
                }
            }
        }));

    var templates = gulp.src('./templates/**/[^_]*.hbs')
        .pipe(handlebars())
        .pipe(wrap('Handlebars.template(<%= contents %>)'))
        .pipe(declare({
            namespace: 'TimeCollector.templates',
            noRedeclare: true // Avoid duplicate declarations
        }));

    // Output both the partials and the templates as build/js/templates.js
    return merge(partials, templates)
        //.pipe(concat('timeCollectorTemplates.js'))
        .pipe(uglify('timeCollectorTemplates.js'))
        .pipe(gulp.dest(CONSTANTS.GADGET_BASE + '/js'));
});

gulp.task('compile:javascript', function () {
    return gulp.src('./scripts/**/*.js')
        .pipe(uglify('timeCollector.js'))
        .pipe(gulp.dest(CONSTANTS.GADGET_BASE + '/js'));
});

gulp.task('compile:bower', function () {
    gulp.src(mainBowerFiles({
        "overrides": {
            "handlebars": {
                "main": "handlebars.runtime.min.js"
            }
        }
    }))
        .pipe(uglify('timeCollectorVendor.js'))
        .pipe(gulp.dest(CONSTANTS.GADGET_BASE + '/js'));
});


gulp.task('compile:css', function () {
    gulp.src('./css/**/*.css')
        .pipe(concat('timeCollector.css'))
        .pipe(gulp.dest(CONSTANTS.GADGET_BASE + '/css'));
});

