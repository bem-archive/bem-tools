var assert = require('assert'),
    UTIL = require('util'),
    PATH = require('path'),
    FS = require('fs'),
    Q = require('q'),
    _ = require('underscore'),
    QFS = require('q-fs'),

    BEMUTIL = require('../lib/util'),
    BEM = require('../lib/coa').api,

    projectPath = PATH.resolve('./test/data/make/project'),
    referencePath = PATH.resolve('./test/data/make/reference-result'),
    buildPath = PATH.resolve('./test-make-temp');

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
                .then(done)
                .end();
        });

        it('completes successfully', function(done) {
            this.timeout(0);

            BEM.make({root: buildPath, verbosity: 'error'})
                .then(done)
                .fail(done)
                .end();
        });

        it('creates proper artifacts', function(done) {
            return command(
                    UTIL.format(
                        'find %s -type f -exec diff -q {} %s/{} \\; 2>&1',
                        '.',
                        PATH.relative(referencePath, buildPath)),
                    {cwd: referencePath},
                    true)
                .then(function(result) {
                    done(result && new Error(result));
                })
                .fail(done)
                .end();
        });

        it('does not rebuild anything on next build with no changes made to the files', function(done) {
            this.timeout(0);

            collectTimestamps(buildPath)
                .then(function(timestamps) {
                    return BEM.make({root: buildPath, verbosity: 'error'})
                        .then(function() {
                            return collectTimestamps(buildPath);
                        })
                        .then(function(newTimestamps){
                            var mismatches = Object.keys(newTimestamps)
                                .filter(function(ts) {
                                    return newTimestamps[ts] !== timestamps[ts];
                                });

                            if (mismatches.length > 0) throw new Error('There are modified files:\n' + mismatches.join('\n'));

                            done();
                        });
                })
                .fail(done)
                .end();
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
                    return BEM.make({root: buildPath, verbosity: 'error'});
                })
                .then(function() {
                    return command(
                            UTIL.format(
                                'find %s -type f -exec diff -q {} %s/{} \\; 2>&1',
                                '.',
                                PATH.relative(referencePath, buildPath)),
                            {cwd: referencePath},
                            true)
                })
                .then(function(result) {
                    done(result && new Error(result));
                })
                .fail(done)
                .end();
        });

        it('clean removes build artifacts', function(done) {
            this.timeout(0);

            BEM.make({root: buildPath, verbosity: 'error', method: 'clean'})
                .then(function() {
                    return Q.all([
                        dirHasOnly(PATH.join(buildPath, 'pages/example'), ['example.bemjson.js']),
                        dirHasOnly(PATH.join(buildPath, 'pages/client'), ['client.bemjson.js'])
                    ])
                    .spread(function(example, client) {
                        if (!(example && client)) throw new Error('build artifacts exist');

                        done();
                    })
                })
                .fail(done)
                .end();
        });

        it('builds two targets', function(done) {
            this.timeout(0);

            prepareProject()
                .then(function(){
                    return BEM.make({
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
                             'example.css.meta.js', 'example.deps.js', 'example.deps.js.meta.js']),
                        dirHasOnly(
                            PATH.join(buildPath, 'pages/client'),
                            ['client.bemjson.js', 'client.bemhtml.js', 'client.deps.js.meta.js', 'client.bemdecl.js',
                            'client.bemhtml.js.meta.js', 'client.deps.js', 'client.html'])
                    ])
                    .spread(function(example, client) {
                        if (!(example && client)) throw new Error('set of build artifacts differs from expected');
                    })
                })
                .then(function() {
                    return command(
                            UTIL.format(
                                'diff -rq %s %s 2>&1 | grep -v ^O; true',
                                '.',
                                PATH.relative(referencePath, buildPath)),
                            {cwd: referencePath},
                            true)
                })
                .then(function(result) {
                    done(result && new Error(result));
                })
                .fail(done)
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
    return BEMUTIL.getFilesAsync(dir)
        .then(function(dirFiles) {
            return dirFiles.length === files.length &&
                _.union(files, dirFiles).length === files.length;
        });
}
