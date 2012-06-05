var UTIL = require('util'),
    Q = require('q'),
    QFS = require('q-fs');

exports.prepareProject = function(projectPath, buildPath) {
    return QFS.exists(buildPath)
        .then(function(exists) {
            return exists && command(UTIL.format('rm -rf %s', buildPath));
        })
        .then(function() {
            return command(UTIL.format('cp -r %s %s', projectPath, buildPath));
        });
};

var command = exports.command = function (cmd, options, resolveWithOutput) {
    var d = Q.defer(),
        output = '',
        cp  = require('child_process').exec(cmd, options);

    cp.on('exit', function (code) {
        code === 0? d.resolve(resolveWithOutput && output?output:null): d.reject(new Error(UTIL.format('%s failed: %s', cmd, output)));
    });

    cp.stderr.on('data', function (data) {
        output += data;
    });

    cp.stdout.on('data', function (data) {
        output += data;
    });

    if (options && options.stdin) cp.stdin.end(options.stdin);

    return d.promise;
}

