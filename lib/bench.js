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

    Table       = require('cli-table');

/**
 * Benchmark - testing on BEMHTML templates performance between revisions
 */
var Benchmark = INHERIT({

    __constructor: function(opts, args){

        this.pathTmp        = '.bem/cache/bench/';
        this.pathSelf       = 'current_state';
        this.pathBenchmarks = 'benchmark.bundles';
        this.treeishList    = args['treeish-list'];
        this.withoutCurrent = opts['no-wc'];
        this.noMake         = opts['no-make'];
        this.benchmarks     = opts.benchmarks;

        this.DELAY             = opts['delay'] ? opts['delay'] : 20;
        this.WARMIN_CYCLE      = 100;
        this.ALLOWABLE_PERCENT = opts['delta-rme'] ? opts['delta-rme'] : 5;

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
                '-av',
                '--exclude=node_modules',
                '--exclude=bench',
                '--exclude=bem-bl',
                '--exclude=.git',
                '.',
                self.pathTmp + self.pathSelf
            ].join(' ');

        LOGGER.time(label);

        return U.exec(cmd)
            .fail(function(err) {
                LOGGER.error('exportWorkingCopy - '.blue + err);
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
    getBenchmarksPaths: function(treeishPath, levelPath) {

        var self = this,
            level =  LEVEL.createLevel(PATH.join(treeishPath, levelPath)),
            benchmarks;

        if (self.benchmarks && self.benchmarks.length) {
            // if -b flag detected then compare not all benchmarks
            benchmarks = U.arrayUnique(self.benchmarks)
                .map(function(b) {
                    return U.bemParseKey(b);
                });
        }
        else {
            // if -b flag not detected then all benchmarks
            benchmarks = level.getItemsByIntrospection()
                .filter(function(item) {
                    return item.tech == 'bemjson.js';
                });
        }

        return benchmarks
            .map(function(benchmark) {
                return level.getPathByObj(benchmark, 'bemjson.js');
            });

    },

    /**
     * Make one target and return all links on blocks
     *
     * @param  {String} target  Path to target
     * @return {Array}  All links of target
     */
    maker: function(target) {

        var self = this,
            pt = [],
            cmd  = 'cd ' + self.pathTmp + target + ' && bem make ' + self.pathBenchmarks;

        if (self.benchmarks) {
            self.benchmarks.forEach(function(benchmark) {
                pt += self.pathBenchmarks + '/' + benchmark + ' ';
            });
            cmd = 'cd ' + self.pathTmp + target + ' && bem make ' + pt;
        }

        return U.exec(cmd)
            .then(function() {
                return self.getBenchmarksPaths(PATH.join(self.pathTmp, target), self.pathBenchmarks);
            });

    },

    /**
     * Make all targets and run benchmarks for each target
     *
     * @param  {Array} targets  List of targets
     * @return {Promise * Object}  Object with tests results
     */
    make: function(targets) {

        var self = this;

        return Q.all(targets.map(function(target) {

            var label = '[' + target.green + '] has been assembled';
            LOGGER.time(label);

            return self.maker(target)
                .then(function(links) {
                    LOGGER.timeEnd(label);
                    return [target].concat(links);
                })
                .fail(function(err) {
                    LOGGER.error(target.red + ' not maked');
                    return Q.reject(err);
                });

        }));

    },

    /**
     * Active waiting
     *
     * @param  {Number} seconds  Time in seconds to wait
     * @return {Promise * Undefined}
     */
    activeWait: function(seconds) {

        if (seconds == 0) return;

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
    bench: function(links, target) {

        var self = this;

        return Q.all(links.map(function(link) {

            var def = Q.defer(),
                bemjson = FS.readFileSync(link , 'UTF-8'),
                bemhtml = require(link.replace(/.bemjson.js/, '.bemhtml.js')),
                context = VM.createContext({}),
                res = VM.runInContext(bemjson, context, link),
                name = link.match(/([^\/]+)$/)[0],
                name_short = name.replace('.bemjson.js',''),
                suite = new BENCHMARK.Suite(),

                label = '[' + target.green + ' => ' +name_short.blue+ '] has been tested';

            LOGGER.time(label);

            // Warming-up for the best results
            (function() {
                var i = self.WARMIN_CYCLE;
                while (i--) bemhtml.BEMHTML.apply(res);
            })();

            suite
                .add(name, function() {
                    bemhtml.BEMHTML.apply(res);
                })
                .on('complete', function(event) {
                    LOGGER.timeEnd(label);
                    def.resolve({
                        'name' : String(event.target.name),
                        'hz'   : Number(Math.round(event.target.hz) / 1000).toFixed(1),
                        'rme'  : Number(event.target.stats.rme).toFixed(1),
                        'runs' : event.target.stats.sample.length
                    });
                })
                .run({ 'async': false });

            return def.promise;

        }))
        .then(function(res) {
            return [target].concat(res);
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
     * @param  {String} source  Path to benchmarks source
     * @return {Promise * Undefined}
     */
    cloneBenchmarks: function(source) {

        var self = this,
            targets = [].concat(this.treeishList),
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
            return self.pathSelf;
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
     * @return {Array}  Sorted results data
     */
    sortResult: function(res) {
        var sorted = [],
            source = this.treeishList;

        for (var i = 0; i < res.length; i++) {
            for (var j = 0; j < res.length; j++) {
                if (res[j][0] === source[i]) {
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
     * @return {Object}  cli table object
     */
    getResultsTable: function(results) {

        var sortedRes = this.sortResult(results),
            header = [],
            data = [],
            rme = [],
            name,
            stat,
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

            for (var j = 0; j < sortedRes.length; j++) {
                if (!name) name = sortedRes[j][i].name;

                if (sortedRes[j][i]) {
                    t.push('[' + sortedRes[j][i].hz.green + '] ±' + sortedRes[j][i].rme.magenta + '%');
                    rme.push(Number(sortedRes[j][i].rme));
                } else {
                    t.push('none');
                }
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
            bcsExclude = 'Exclude ' + String(this.pathSelf).magenta;

        LOGGER.time('All time');

        if (!self.noMake) {

            return U.mkdirp(this.pathTmp)
                .then(function() {
                    return self.cleanTempDir();
                })
                .then(function() {

                    var allBackups = [];

                    if (!self.withoutCurrent) {
                        LOGGER.info(bcsInclude);
                        allBackups = [self.exportWorkingCopy()].concat(self.exportGitRevisions());
                        self.treeishList = self.treeishList.concat(self.pathSelf);
                    } else {
                        LOGGER.info(bcsExclude);
                        allBackups = self.exportGitRevisions();
                    }

                    return Q.all(allBackups)
                        .then(function() {
                            return self.getLatestTreeish();
                        })
                        .then(function(latestRevision) {
                            return self.cloneBenchmarks(latestRevision);
                        })
                        .then(function() {
                            LOGGER.info('Make...');
                            return self.make(self.treeishList);
                        })
                        .then(function(linksPack) {

                            LOGGER.info('Benchmark... ');
                            return Q.all(linksPack.map(function(pack) {
                                var links = pack.slice(1),
                                    trg = pack[0];

                                self.activeWait(self.DELAY);
                                return self.bench(links, trg);
                            }));

                        })
                        .then(function(res) {
                            LOGGER.timeEnd('All time');
                            return self.getResultsTable(res);
                        });

                });

        } else {

            // without make
            LOGGER.info('[NO MAKE]'.magenta + ' mode');

            if (!self.withoutCurrent) {
                LOGGER.info(bcsInclude);
                self.treeishList = [self.pathSelf].concat(self.treeishList);
            } else {
                LOGGER.info(bcsExclude);
            }

            return Q.all(self.treeishList
                    .map(function(target) {
                        return Q.resolve([target].concat(self.getBenchmarksPaths(PATH.join(self.pathTmp, target), self.pathBenchmarks)));
                    })
                )
                .then(function(linksPack) {
                    LOGGER.info('Benchmark...');
                    return Q.all(linksPack
                        .map(function(pack) {
                            var links  = pack.slice(1),
                                trg = pack[0];

                            self.activeWait(self.DELAY);
                            return self.bench(links, trg);
                        }));
                })
                .then(function(res) {
                    LOGGER.timeEnd('All time');
                    return self.getResultsTable(res);
                });

        }

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
