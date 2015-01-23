var Cucumber = require('cucumber');
var glob = require('simple-glob');
var through2 = require('through2');
var PluginError = require('gulp-util').PluginError;
var exec = require('child_process').exec;
var path = require('path');
var cucumber = function(options) {
    var files = [];
    var runOptions = [];
    var inProcess;
    var excludeOptions = ['support', 'steps', 'format', 'inProcess'];    //As these are dealt with below
    var option;
    if (options.support) {
        files = files.concat(glob([].concat(options.support)));
    }

    if (options.steps) {
        files = files.concat(glob([].concat(options.steps)));
    }

    inProcess = (!options.hasOwnProperty('inProcess') || options.inProcess)

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
        var cucumberPath;
        var argv = ['node', 'cucumber-js'];
        var child;

        argv.push.apply(argv, runOptions);
        argv.push.apply(argv, features);

        var stream = this;
        if (inProcess) {
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
        } else {
            cucumberPath = path.resolve(require.resolve('cucumber'), '../../bin/cucumber.js');
            child = exec(process.execPath + ' ' + cucumberPath + ' ' + argv.slice(2).join(' '), function (err) {
                if (err) {
                    stream.emit('error', new PluginError('gulp-cucumber', {
                        message: 'Gulp Cucumber failed',
                        showStack: false
                    }));
                } else {
                    callback();
                    stream.emit('end');
                }
            });
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);

        }
    };

    return through2.obj(collect, run);
};

module.exports = cucumber;
