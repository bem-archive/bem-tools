var assert = require('assert'),
    UTIL = require('util'),
    PATH = require('path'),
    FS = require('fs'),
    Q = require('q'),
    _ = require('underscore'),
    QFS = require('q-fs'),
    SA = require('superagent'),

    BEMUTIL = require('../lib/util'),
    BEM = require('bem').api,

    projectPath = PATH.resolve('./test/data/make/project'),
    referencePath = PATH.resolve('./test/data/make/reference-result'),
    buildPath = PATH.resolve('./test-make-temp');

describe('bem', function() {
    describe('server', function() {

        before(function(done){
            prepareProject()
                .then(function() {
                    return BEM.server({root: buildPath, verbosity: 'info'});
                })
                .then(done)
                .end();

            setTimeout(done, 1000);
        });

        it('builds html page on request', function(done) {
            this.timeout(30000);

            req('pages/example/example.html')
                .then(function(res){
                    assert.equal(res.status, 200, 'response status is 200');
                    done();
                })
                .end();
        });

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

function req(path) {
    var d = Q.defer();

    SA
        .get('http://localhost:8080/' + path)
        .end(function(res) {
            d.resolve(res);
        });

    return d.promise;
}