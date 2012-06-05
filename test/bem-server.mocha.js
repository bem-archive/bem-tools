var assert = require('assert'),
    UTIL = require('util'),
    PATH = require('path'),
    Q = require('q'),
    _ = require('underscore'),
    QHTTP = require('q-http'),

    BEM = require('../lib/coa').api,

    C = require('./common'),

    projectPath = PATH.resolve(__dirname, '../test/data/make/project'),
    referencePath = PATH.resolve(__dirname, '../test/data/make/reference-result'),
    buildPath = PATH.resolve(__dirname, '../test-make-temp');

describe('bem', function() {
    describe('server', function() {

        before(function(done){
            C.prepareProject(projectPath, buildPath)
                .then(function() {
                    return BEM.server({root: buildPath, verbosity: 'error'});
                })
                .then(done)
                .end();

            setTimeout(done, 1000);
        });

        it('builds html page on request', function(done) {
            this.timeout(30000);

            reqAndValidate('pages/example/example.html')
                .then(function(result) {
                    done(result && new Error(result));
                })
                .end();
        });

        for(var i = 1; i <= 10; i++) {
            it('handles simultaneous requests (iteration ' + i +')', function(done) {
                this.timeout(300000);

                var pages = ['pages/example/example.html', 'pages/example/example.css', 'pages/example/_example.css',
                 'pages/example/example.js', 'pages/example/_example.ie.css', 'pages/example/_example.js',
                'pages/client/client.html', 'pages/client/client.css', 'pages/client/_client.css',
                'pages/client/client.js', 'pages/client/_client.ie.css', 'pages/client/_client.js'];

                Q.all([
                    Q.all(pages.map(function(p) {
                        return reqAndValidate(p);
                    })),

                    Q.all(pages.map(function(p) {
                        var d = Q.defer();
                        setTimeout(function() {
                            reqAndValidate(p)
                                .then(function(res) {
                                    d.resolve(res);
                                });
                        }, 700);

                        return d.promise;
                    }))])
                .spread(function(all1, all2) {
                    var err;
                    all1.concat(all2).forEach(function(result) {
                        if (result) err = err||'' + result + '\n';
                    })

                    done(err && new Error(err));
                })
                .end();
            });
        }
    });
});

function req(path) {
    return QHTTP.read('http://localhost:8080/' + path);
}

function reqAndValidate(path) {
    return req(path)
        .then(function(res){
            return C.command(UTIL.format('diff -q %s/%s -', referencePath, path), {stdin: res}, true);
        })
        .then(function(result) {
            return result;
        });
}
