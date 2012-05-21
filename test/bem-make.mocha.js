var assert = require('assert'),
    UTIL = require('util'),
    PATH = require('path'),
    FS = require('fs'),
    Q = require('q'),
    QFS = require('q-fs'),

    BEM = require('bem').api,

    projectPath = PATH.resolve('./test/data/make/project'),
    referencePath = PATH.resolve('./test/data/make/reference-result'),
    buildPath = PATH.resolve('./test-make-temp');

describe('bem', function() {

    before(function(done){
        prepareProject()
            .then(done);
    });

    describe('make', function() {

        it('completes successfully', function(done) {
            this.timeout(0);

            BEM.make({root: buildPath, verbosity: 'error'})
                .then(done)
                .fail(done);
        });

        it('creates proper artifacts', function(done) {
            return command(
                    UTIL.format(
                        'find %s -type file -exec diff -q {} %s/{} \\; 2>&1',
                        '.',
                        PATH.relative(referencePath, buildPath)),
                    {cwd: referencePath},
                    true)
                .then(function(result) {
                    done(result && new Error(result));
                })
                .fail(done);
        })
    });
});


function prepareProject() {
    return QFS.exists(buildPath)
        .then(function(exists) {
            return exists && command(UTIL.format('rm -rf %s', buildPath));
        })
        .then(function() {
            return command(UTIL.format('cp -r %s %s', projectPath, buildPath));
        });
}

function command(cmd, options, resolveWithOutput) {
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

    return d.promise;
}