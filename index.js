var Cucumber = require('cucumber');
var glob = require('simple-glob');
var through2 = require('through2');
var PluginError = require('gulp-util').PluginError;

var cucumber = function(options) {
    var files = [];
    var runOptions = [];
    var excludeOptions = ['support', 'steps', 'format'];    //As these are dealt with below
    var option;
    if (options.support) {
        files = files.concat(glob([].concat(options.support)));
    }

    if (options.steps) {
        files = files.concat(glob([].concat(options.steps)));
    }

    files.forEach(function(file) {
        runOptions.push('-r');
        runOptions.push(file);
    });

    // Pass on any other options to the command line as a switch with an optional value.
    // to use a switch that does not need a value, use null as the value in the options object
    for (option in options) {
        if (excludeOptions.indexOf(option) === -1) {
            if (option.length === 1) {
                runOptions.push('-' + option);
            } else {
                runOptions.push('--' + option);
            }
            if (options[option] !== null) {
                runOptions.push(options[option]);
            }
        }
    }

    runOptions.push('-f');
    var format = options.format || 'pretty';
    runOptions.push(format);

    var features = [];

    var collect = function(file, enc, callback) {
        var filename = file.path;
        if (filename.indexOf(".feature") === -1) {
            return callback();
        }
        features.push(filename);
        callback();
    };

    var run = function(callback) {
        var argv = ['node', 'cucumber-js'];

        argv.push.apply(argv, runOptions);
        argv.push.apply(argv, features);

        var stream = this;
        Cucumber.Cli(argv).run(function(succeeded) {
            if (succeeded) {
                callback();
                stream.emit('end');
            } else {
                stream.emit('error', new PluginError('gulp-cucumber', {
                    message: 'Gulp Cucumber failed',
                    showStack: false
                }));
            }
        });
    };

    return through2.obj(collect, run);
};

module.exports = cucumber;
