'use strict';

var componentList = [];

var fs = require('fs');
var path = require('path');

module.exports = function(config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: './',

    // list of files / patterns to load in the browser
    files: [
      "components/jquery/dist/jquery.js",
      "components/angular/angular.js",
      "components/lodash/lodash.js",
      "components/angular-mocks/angular-mocks.js",
      "*.js",
      "*.spec.js"
    ],

    browsers: ['PhantomJS'],

    frameworks: ['jasmine'],

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit'
    reporters: ['dots'],

    reportSlowerThan: 50,

    // enable / disable watching file and executing tests
    // whenever any file changes
    autoWatch: true,

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true
  });
};
