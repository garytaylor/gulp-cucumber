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
    var excludeOptions = ['support', 'steps', 'format', 'inProcess', 'env'];    //As these are dealt with below
    var option;
    var optionValues;
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
            optionValues = (options[option] instanceof Array) ? options[option] : [options[option]];
            optionValues.forEach(function (v) {
                if (option.length === 1) {
                    runOptions.push('-' + option);
                } else {
                    runOptions.push('--' + option);
                }
                if (v !== null) {
                    runOptions.push(v);
                }

            });
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
        var envVar;
        var execOptions;

        argv.push.apply(argv, runOptions);
        argv.push.apply(argv, features);

        var stream = this;
        if (inProcess) {
            if (options.env) {
                for(envVar in options.env) {
                    process.env[envVar] = options.env[envVar];
                    //@TODO Tidy this up afterwards as we will have changed the global environment for this process
                }
            }
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
            execOptions = {};
            if (options.env) {
                execOptions.env = options.env;
            }
            child = exec(process.execPath + ' ' + cucumberPath + ' ' + argv.slice(2).join(' '), execOptions, function (err) {
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
