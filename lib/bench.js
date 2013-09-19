'use strict';

var Q           = require('q'),
    COLORS      = require('colors'),
    BENCHMARK   = require('benchmark'),
    FS          = require('fs'),
    VM          = require('vm'),
    PATH        = require('path'),
    CP          = require('child_process'),
    INHERIT     = require('inherit'),
    LOGGER      = require('./logger'),
    LEVEL       = require('./level'),
    U           = require('./util'),
    UTIL        = require('util'),

    Table       = require('cli-table');

/**
 * Benchmark - testing on BEMHTML templates performance between revisions
 */
var Benchmark = INHERIT({

    __constructor: function(opts, args){

        this.pathTmp        = '.bem/cache/bench/';
        this.pathSelf       = 'current_state';
        this.treeishList    = args['treeish-list'] || [];
        this.withoutCurrent = opts['no-wc'];
        this.rerun          = opts.rerun;
        this.benchmarks     = opts.benchmarks;
        this.techs          = opts.techs;

        this.DELAY             = opts.delay ? opts.delay : 20;
        this.WARMING_CYCLE     = 100;
        this.ALLOWABLE_PERCENT = opts.rme ? opts.rme : 5;

    },

    /**
     * Extract one revision to pathTmp folder
     *
     * @param  {String} treeish  Hash, HEAD, tag...
     * @return {Promise * String}  Path to temporary revision
     */
    exportGitRevision: function(treeish) {

        var def = Q.defer(),
            label = 'Export git revision [' + treeish.green + ']',
            archiveErr = '',
            extractErr = '',
            extract,
            archive;

        LOGGER.time(label);

        archive = CP.spawn('git', [
            'archive',
            '--format=tar',
            '--prefix=' + this.pathTmp + '/' + treeish + '/',
            treeish
        ]);
        extract = CP.spawn('tar', ['-x']);

        archive.stdout.on('data', function(data) {
            extract.stdin.write(data);
        });

        archive.stderr.on('data', function(err) {
            archiveErr += err.toString().replace(/(\n)$/, '');
        });

        archive.on('close', function(code) {
            if (code !== 0) {
                LOGGER.error('exportGitRevision - '.blue + '[' + treeish.green + '] ' + archiveErr);
                def.reject(new Error(archiveErr));
            } else {
                LOGGER.timeEnd(label);
                def.resolve(treeish);
            }
            extract.stdin.end();
        });

        extract.stderr.on('data', function(err) {
            extractErr += err.toString().replace(/(\n)$/, '');
        });

        extract.on('close', function(code) {
            if (code !== 0) {
                LOGGER.error('exportGitRevision - '.blue + '[' + treeish.green + '] ' + extractErr);
                def.reject(new Error(extractErr));
            }
        });

        return def.promise;

    },

    /**
     * Copy current files state with exclude
     *
     * @return {Promise * String}  Path to files
     */
    exportWorkingCopy: function() {

        var self = this,
            label = 'Export working copy [' + self.pathSelf.green + ']',
            cmd = [
                'rsync',
                '-a',
                '--exclude=/.git',
                '--exclude=/.svn',
                '--exclude=/' + self.pathTmp,
                '.',
                self.pathTmp + self.pathSelf
            ].join(' ');

        LOGGER.time(label);

        return U.exec(cmd)
            .fail(function(err) {
                LOGGER.error('exportWorkingCopy'.blue);
                return Q.reject(err);
            })
            .then(function() {
                LOGGER.timeEnd(label);
                return self.pathSelf;
            });

    },

    /**
     *  Getting all paths to .bemjson.js file on needed level
     *
     *  @param  {String} treeishPath  Checked out treeish path
     *  @param  {String} levelPath  level path
     *  @return {Array}  Array of links
     */
    getBenchmarksPaths: function(treeishPath) {

        var self = this,
            benchmarks;

        if (self.benchmarks && self.benchmarks.length) {
            // if -b flag detected then compare not all benchmarks
            benchmarks = self.benchmarks
                .map(function(item) {
                    return item.split('/')[0];
                })
                .filter(function (e, i, arr) {
                    return arr.indexOf(e) === i;
                });

            benchmarks = benchmarks
                .map(function(level) {
                    return {
                        'level': level,
                        'bemjsonPaths': self.benchmarks
                            .map(function(item) {
                                var levelAndBlock = item.split('/'),
                                    currLevel = levelAndBlock[0],
                                    block = levelAndBlock[1];
                                
                                if (level === currLevel) {
                                    return LEVEL.createLevel(PATH.join(treeishPath, level))
                                        .getPathByObj(U.bemParseKey(block), 'bemjson.js');
                                } else {
                                    return null;
                                }
                            })
                            .filter(function(item) {
                                return item !== null;
                            })
                    };
                });

        }
        else {
            // if -b flag not detected then all benchmarks
            benchmarks = self
                .getBenchLevelsByPath(treeishPath)
                    .map(function(item) {
                        return {
                            'level': item,
                            'bemjsonPaths': LEVEL
                                .createLevel(PATH.join(treeishPath, item))
                                    .getItemsByIntrospection()
                                        .filter(function(subItem) {
                                            return subItem.suffix === '.bemjson.js';
                                        })
                                        .map(function(subItem) {
                                            return PATH.join(
                                                process.cwd(),
                                                treeishPath,
                                                item,
                                                subItem.block,
                                                subItem.block + subItem.suffix
                                            );
                                        })
                        };
                    });
        }
        return benchmarks;
    },

    /**
     * Make one target and return all links on blocks
     *
     * @param  {String} target  Path to target
     * @return {Array}  All links of target
     */
    makeTarget: function(target) {

        var self = this,
            targets = [self.pathBenchmarks],
            label = '[' + target.green + '] has been assembled',
            packageJson = FS.readFileSync(PATH.join(self.pathTmp, target, 'package.json')).toString(),
            script = JSON.parse(packageJson).scripts,
            defaultMake = 'npm install && ./node_modules/.bin/bem make',
            make = null;

        LOGGER.time(label);

        if (self.benchmarks && self.benchmarks.length) {
            targets = self.benchmarks
                .map(function(b) {
                    return PATH.join(self.pathBenchmarks, b);
                });
        }

        if(script && script['bem-bench-build']) {
            make = script['bem-bench-build'];
            if (/\$targets/.test(make)) {
                if (!self.benchmarks) {
                    LOGGER.warn('$targets'.blue + ' not been defined through ' + "-b".green + ' option');
                    LOGGER.warn('$targets'.blue + ' change to ' + self.pathBenchmarks.blue);
                }
                make = make.replace('$targets', targets.join(' '));
            }
        } else {
            make = defaultMake + ' ' + targets.join(' ');
        }

        LOGGER.info('MAKE STRING [' + target.green + ']:\n', make.replace(/&&/gi, '&&\n'.green).underline);

        return U.exec('cd ' + PATH.join(self.pathTmp, target) + ' && ' + make)
            .fail(function(err) {
                LOGGER.error(target.red + ' not make');
                return Q.reject(err);
            })
            .then(function() {
                LOGGER.timeEnd(label);
            });

    },

    /**
     * Make all targets and run benchmarks for each target
     *
     * @param  {Array} targets  List of targets
     * @return {Promise * Undefined}  Object with tests results
     */
    makeAll: function(targets) {
        return Q.all(targets.map(this.makeTarget.bind(this)))
            .then(function() {});
    },

    /**
     * Active waiting
     *
     * @param  {Number} seconds  Time in seconds to wait
     * @return {Promise * Undefined}
     */
    activeWait: function(seconds) {

        if (seconds === 0) return;

        var dt = new Date().getTime(),
            title = seconds + 'sec';

        LOGGER.info('Delay ' + title.red);
        while (dt + (seconds * 1000) > new Date().getTime()) {}

    },

    /**
     * Run all benchmarks of the single target
     *
     * @param  {Array} links  Links to source bemjson files
     * @param  {String} target  Revision name
     * @return {Promise * Object}  Object with tests results
     */
    runBenchmark: function(links, target) {

        var self = this;

        return Q.all(links.map(function(link) {

            var def = Q.defer(),
                bemjson = FS.readFileSync(link , 'UTF-8'),
                bemhtml = link.replace(/.bemjson.js/, '.bemhtml.js'),
                bh = link.replace(/.bemjson.js/, '.bh.js'),
                context = VM.createContext({}),
                res = VM.runInContext(bemjson, context, link),
                name = link.match(/([^\/]+)$/)[0],
                nameShort = name.replace('.bemjson.js',''),
                suite = new BENCHMARK.Suite(),
                results = [],
                isBh = false,
                isBemhtml = false,

                label = '[' + target.green + ' => ' + nameShort.blue + '] has been tested';


            LOGGER.time(label);

            if (U.isFile(bemhtml)) {
                if (!self.techs || self.techs.indexOf('bemhtml') !== -1) {
                    bemhtml = require(bemhtml);
                    isBemhtml = true;
                }
            }

            if (U.isFile(bh)) {
                if (!self.techs || self.techs.indexOf('bh') !== -1) {
                    bh = require(bh);
                    isBh = true;
                }
            }

            // Warming-up for the best results
            (function() {
                var i = self.WARMING_CYCLE;
                while (i--) {
                    if (isBemhtml) bemhtml.BEMHTML.apply(res);
                    if (isBh) bh.INST.apply(res);
                }
            })();

            if (isBh) {
                suite.add(name + '(bh)'.underline, function() {
                    bh.INST.apply(res);
                });
            }

            if (isBemhtml) {
                suite.add(name + '(bemhtml)'.underline, function() {
                    bemhtml.BEMHTML.apply(res);
                });
            }

            suite
                .on('cycle', function(event) {
                    results.push({
                        'name' : String(event.target.name),
                        'hz'   : Number(Math.round(event.target.hz) / 1000).toFixed(1),
                        'rme'  : Number(event.target.stats.rme).toFixed(1),
                        'runs' : event.target.stats.sample.length,
                        'isSeparator' : isBemhtml && isBh
                    });
                })
                .on('complete', function(event) {
                    LOGGER.timeEnd(label);
                    def.resolve(results);
                })
                .on('error', function(err) {
                    def.reject(err);
                })
                .run({ 'async': false });

            return def.promise;

        }))
        .then(function(rs) {
            var objs = [];

            rs.forEach(function(i) {
                i.forEach(function(j) {
                    j.forEach(function(k) {
                        objs.push(k);
                    });
                });
            });

            return [target].concat(objs);
        });

    },

    /**
     * Extract all revisions and mark that it exist
     *
     * @return {Promise * Undefined}
     */
    exportGitRevisions: function() {

        var self = this;

        return self.treeishList
            .map(function(treeish) {
                return self.exportGitRevision(treeish);
            });

    },

    /**
     * Copy reference benchmarks from specified source into every checked out revision
     *
     * @param  {String[]} targets  Array of target names
     * @param  {String} source  Path to benchmarks source
     * @return {Promise * Undefined}
     */
    cloneBenchmarks: function(source, targets) {

        targets = [].concat(targets);

        var self = this,
            search = targets.indexOf(source),

            onFail = function(err) {
                LOGGER.error('cloneBenchmarks - '.blue + err);
                return Q.reject(err);
            };

        if (search !== -1) {
            targets.splice(search, 1);
        }

        return Q.all(targets.map(function(target) {

            var cmd = 'rm -rf ' + PATH.join(self.pathTmp, target, self.pathBenchmarks);

            return U.exec(cmd)
                .fail(onFail)
                .then(function() {

                    var cmd = [
                        'cp',
                        '-R',
                        PATH.join(self.pathTmp, source, self.pathBenchmarks + '*'),
                        PATH.join(self.pathTmp, target, self.pathBenchmarks)
                    ].join(' ');

                    return U.exec(cmd)
                        .fail(onFail);

                });

        }));

    },

    /**
     * Return latest treeish compared at date
     *
     * @return {String}  Latest treeish
     */
    getLatestTreeish: function() {

        var self = this;

        if (!self.withoutCurrent) {
            LOGGER.info('Latest revision is - ', self.pathSelf.magenta);
            return Q.resolve(self.pathSelf);
        }

        return Q.all(self.treeishList
            .map(function(treeish) {

                var cmd = "git show " + treeish + " | grep Date | awk -F':   ' '{print $2}'";

                return U.exec(cmd, null, true)
                    .then(function(output) {
                        return {
                            treeish: treeish,
                            date: output.replace('\n', '')
                        };
                    });

            })
        )
        .then(function(dates) {

            var maxTime = 0,
                lastTreeish;

            dates.forEach(function(dt) {
                var time = new Date(dt.date).getTime();
                if (time > maxTime) {
                    maxTime = time;
                    lastTreeish = dt.treeish;
                }
            });

            LOGGER.info('Latest revision is - ' + lastTreeish.magenta);

            return lastTreeish;

        });

    },

    /**
     * Sort results by command line order
     *
     * @param  {Object} res  Results data
     * @param  {String[]} targets  Array of target names
     * @return {Array}  Sorted results data
     */
    sortResult: function(res, targets) {
        var sorted = [];

        for (var i = 0; i < res.length; i++) {
            for (var j = 0; j < res.length; j++) {
                if (res[j][0] === targets[i]) {
                    sorted.push(res[j]);
                    break;
                }
            }
        }

        return sorted;
    },

    /**
     * Construct cli table object with benchmarks results
     *
     * @param  {Object} results  Object with test results
     * @param  {String[]} targets  Array of target names
     * @return {Object}  cli table object
     */
    getResultsTable: function(results, targets) {

        var sortedRes = this.sortResult(results, targets),
            header = [],
            data = [],
            rme = [],
            isSeparator,
            name,
            perc,
            t;

        header.push(
            '№'.magenta,
            'benchmark'.yellow.underline);

        sortedRes.forEach(function(item) {
            header.push(item[0].blue + '(hz/rme)'.cyan);
        });

        for (var i = 1; i < sortedRes[0].length; i += 1) {
            name = undefined;
            t = [];
            rme = [];
            isSeparator = false;

            for (var j = 0; j < sortedRes.length; j++) {
                if (!name) name = sortedRes[j][i].name;

                if (sortedRes[j][i]) {
                    t.push('[' + sortedRes[j][i].hz.green + '] ±' + sortedRes[j][i].rme.magenta + '%');
                    rme.push(Number(sortedRes[j][i].rme));
                    if (sortedRes[j][i].isSeparator === true) {
                        isSeparator = true;
                    }
                } else {
                    t.push('none');
                }
            }

            if ((i+1) % 2 === 0 && isSeparator) {
                data.push([]);
            }

            var max = Math.max.apply(null, rme),
                min = Math.min.apply(null, rme);

            if ((max - min) < this.ALLOWABLE_PERCENT) {
                perc = 'stable'.yellow.underline;
            } else {
                perc = 'unstable'.red.underline;
            }

            data.push([i, name.replace('.bemjson.js', '')]
                .concat(t)
                .concat(perc));

        }

        header.push('RME stat'.magenta);

        var table = new Table({
            head: header,
            style: {
                compact: true,
                'padding-left': 1,
                'padding-right': 1
            }
        });

        data.forEach(function(row) {
            table.push(row);
        });

        return table;

    },

    /**
     * Cleaning all repo from temporary folder
     *
     * @return {Promise * Undefined}
     */
    cleanTempDir: function() {

        var cmd = 'rm -rf ./' + this.pathTmp + '*',
            label = 'TMP folder has been cleaned';

        LOGGER.info('Cleaning a TMP folder');
        LOGGER.time(label);

        return U.exec(cmd)
            .fin(function() {
                LOGGER.timeEnd(label);
            });

    },

    /**
     * Main flow
     *
     * @return {Promise}  Promise of benchmarks finish
     */
    start: function() {

        var self = this,
            bcsInclude = 'Include ' + String(this.pathSelf).magenta,
            bcsExclude = 'Exclude ' + String(this.pathSelf).magenta,
            targets = [].concat(self.treeishList);

        LOGGER.time('All time');

        if (!self.withoutCurrent) {
            LOGGER.info(bcsInclude);
            targets.push(self.pathSelf);
        } else {
            LOGGER.info(bcsExclude);
        }

        return Q.resolve()
            .then(function() {

                if (self.rerun) {

                    // without make
                    LOGGER.info('[NO MAKE]'.magenta + ' mode');
                    return Q.resolve();

                }
                else {

                    // export and make revisions
                    return U.mkdirp(self.pathTmp)
                        .then(function() {
                            return self.cleanTempDir();
                        })
                        .then(function() {

                            var exports = self.exportGitRevisions();
                            if (!self.withoutCurrent) {
                                exports.push(self.exportWorkingCopy());
                            }

                            return Q.all(exports)
                                .then(function() {
                                    return self.getLatestTreeish()
                                        .then(function(rev) {
                                            return self.cloneBenchmarks(rev, targets);
                                        });
                                })
                                .then(function() {
                                    LOGGER.info('Make...');
                                    return self.makeAll(targets);
                                });

                        });

                }

            })
            .then(function() {
                LOGGER.info('Benchmark...');

                return Q.all(targets
                    .map(function(target) {

                        var links = self.getBenchmarksPaths(
                            PATH.join(self.pathTmp, target),
                            self.pathBenchmarks);

                        self.activeWait(self.DELAY);
                        return self.runBenchmark(links, target);

                    })
                );

            })
            .then(function(res) {
                LOGGER.timeEnd('All time');
                return self.getResultsTable(res, targets);
            });

    }

});

/**
 * Create instance on Benchmark and share it
 * 
 * @param  {Array} opts Options from COA
 * @param  {Array} args Arguments from COA
 * @return {Object} Benchmark instance
 */
module.exports = function(opts, args) {
    return new Benchmark(opts, args);
};
