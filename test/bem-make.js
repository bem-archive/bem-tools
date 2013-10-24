'use strict';

var assert = require('chai').assert,
    UTIL = require('util'),
    PATH = require('path'),
    Q = require('q'),
    _ = require('lodash/dist/lodash.underscore'),
    QFS = require('q-io/fs'),

    BEM = require('..'),

    projectPath = PATH.resolve(__dirname, 'data/make/project'),
    referencePath = PATH.resolve(__dirname, 'data/make/reference-result'),
    buildPath = PATH.resolve(__dirname, '../test-make-temp');

/**
 * Mocha BDD interface.
 *
 * @name describe @function
 * @name it @function
 * @name before @function
 * @name after @function
 * @name beforeEach @function
 * @name afterEach @function
 */

describe('bem', function() {
    describe('make', function() {

        before(function(done){
            prepareProject()
                .done(done);
        });

        it('completes successfully', function(done) {
            this.timeout(0);

            BEM.api.make({root: buildPath, verbosity: 'error'})
                .then(done)
                .fail(done)
                .done();
        });

        it('creates proper artifacts', function() {
            return assert.eventually.isNull(
                BEM.util.exec(
                    UTIL.format(
                        'find %s -type f -exec diff -q {} %s/{} \\; 2>&1',
                        '.',
                        PATH.relative(referencePath, buildPath)),
                    {cwd: referencePath},
                    true)
            );
        });

        it('does not rebuild anything on next build with no changes made to the files', function(done) {
            this.timeout(0);

            collectTimestamps(buildPath)
                .then(function(timestamps) {
                    return BEM.api.make({root: buildPath, verbosity: 'error'})
                        .then(function() {
                            return collectTimestamps(buildPath);
                        })
                        .then(function(newTimestamps){
                            var mismatches = Object.keys(newTimestamps)
                                .filter(function(ts) {
                                    return newTimestamps[ts].getTime() !== timestamps[ts].getTime();
                                });

                            if (mismatches.length > 0) throw new Error('There are modified files:\n' + mismatches.join('\n'));

                            done();
                        });
                })
                .fail(done)
                .done();
        });

        it('rebuilds missing artifacts on consequent build', function(done) {
            this.timeout(0);

            Q.all(['pages/example/example.html',
             'pages/example/example.css',
             'pages/client/client.html',
             'pages/client/client.css'].map(function(file) {
                    return QFS.remove(PATH.join(buildPath, file));
                }))
                .then(function() {
                    return BEM.api.make({root: buildPath, verbosity: 'error'});
                })
                .then(function() {
                    return BEM.util.exec(
                            UTIL.format(
                                'find %s -type f -exec diff -q {} %s/{} \\; 2>&1',
                                '.',
                                PATH.relative(referencePath, buildPath)),
                            {cwd: referencePath},
                            true);
                })
                .then(function(result) {
                    done(result && new Error(result));
                })
                .fail(done)
                .done();
        });

        it('clean removes build artifacts', function(done) {
            this.timeout(0);

            BEM.api.make({root: buildPath, verbosity: 'error', method: 'clean'})
                .then(function() {
                    return Q.all([
                        dirHasOnly(PATH.join(buildPath, 'pages/example'), ['example.bemjson.js']),
                        dirHasOnly(PATH.join(buildPath, 'pages/client'), ['client.bemjson.js'])
                    ])
                    .spread(function(example, client) {
                        if (!(example && client)) throw new Error('build artifacts exist');

                        done();
                    });
                })
                .fail(done)
                .done();
        });

        it('builds two targets', function(done) {
            this.timeout(0);

            prepareProject()
                .then(function(){
                    return BEM.api.make({
                        root: buildPath,
                        verbosity: 'error'
                        },
                        {
                            targets: ['pages/example/_example.css', 'pages/client/client.html']
                        });
                })
                .then(function(){
                    return Q.all([
                        dirHasOnly(
                            PATH.join(buildPath, 'pages/example'),
                            ['example.bemjson.js', '_example.css', 'example.bemdecl.js', 'example.css',
                             'example.deps.js']),
                        dirHasOnly(
                            PATH.join(buildPath, 'pages/client'),
                            ['client.bemjson.js', 'client.bemhtml.js', 'client.bemdecl.js',
                            'client.deps.js', 'client.html']),
                        dirHasOnly(
                            PATH.join(buildPath, '.bem/cache/pages/example'),
                            ['example.css.meta.js', 'example.deps.js.meta.js']
                        ),
                        dirHasOnly(
                            PATH.join(buildPath, '.bem/cache/pages/client'),
                            ['client.deps.js.meta.js', 'client.bemhtml.meta.js']
                        )
                    ])
                    .spread(function(example, client) {
                        if (!(example && client)) throw new Error('set of build artifacts differs from expected');
                    });
                })
                .then(function() {
                    return BEM.util.exec(
                            UTIL.format(
                                'diff -rq %s %s 2>&1 | grep -v ^O; true',
                                '.',
                                PATH.relative(referencePath, buildPath)),
                            {cwd: referencePath},
                            true);
                })
                .then(function(result) {
                    done(result && new Error(result));
                })
                .fail(done)
                .done();
        });

        it('invalidates deps when bemdecl is modified', function(done) {
            this.timeout(0);

            prepareProject()
                .then(function() {
                    BEM.api.make({root: buildPath, verbosity: 'error'})
                        .then(function() {
                            return BEM.util.exec(UTIL.format('cp %s %s',
                                PATH.resolve(__dirname, 'data/make/misc/changed.bemjson.js'),
                                PATH.resolve(buildPath, 'pages/example/example.bemjson.js')))

                                .then(function() {
                                    return BEM.api.make({root: buildPath, verbosity: 'error'},
                                        {
                                            targets: ['pages/example/example.deps.js']
                                        });
                                })
                                .then(function() {
                                    return Q.all([
                                            QFS.lastModified(PATH.join(buildPath, 'pages/example/example.bemjson.js')),
                                            QFS.lastModified(PATH.join(buildPath, 'pages/example/example.deps.js'))
                                        ])
                                        .spread(function(bemjson, deps) {
                                            assert.operator(deps.getTime(), '>=', bemjson.getTime());
                                        });
                                });

                        })
                        .then(done)
                        .fail(done)
                        .done();

                });
        });

    });
});


function prepareProject() {
    return QFS.exists(buildPath)
        .then(function(exists) {
            return exists && BEM.util.exec(UTIL.format('rm -rf %s', buildPath));
        })
        .then(function() {
            return BEM.util.exec(UTIL.format('cp -r %s %s', projectPath, buildPath));
        });
}

function collectTimestamps(root) {
    var list = {};

    return QFS.listTree(root, function(path, stat) {
        return PATH.basename(path)[0] !== '.' &&
            Q.when(stat.isFile(), function(isFile) {
                if (isFile) {
                    return QFS.lastModified(path)
                        .then(function(modified) {
                            list[path] = modified;
                            return true;
                        });
                }

                return false;
            });
    })
    .then(function() {
        return list;
    });
}

function dirHasOnly(dir, files) {
    return BEM.util.getFilesAsync(dir)
        .then(function(dirFiles) {
            return dirFiles.length === files.length &&
                _.union(files, dirFiles).length === files.length;
        });
}
