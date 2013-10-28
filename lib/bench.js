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
        this.benchmarks     = args.benchmarks;
        this.withoutCurrent = opts['no-wc'];
        this.rerun          = opts.rerun;
        this.treeishList    = opts['treeish-list'] || [];
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
     *  Getting all paths to .bemjson.js file for level
     *
     *  @param  {String} treeishPath  Checked out treeish path
     *  @return {Array}  Array of links
     */
    getBenchmarksPaths: function(treeishPath) {

        var self = this,
            benchmarks;

        if (self.benchmarks && self.benchmarks.length) {

            benchmarks = self.benchmarks
                .reduce(function(prev, curr) {
                    var level = self.getLevel(curr);
                    if (level && !~prev.indexOf(level)) {
                        return prev.concat(level);
                    }
                    return prev;
                }, [])
                .map(function(level) {
                    return {
                        level: level,
                        bemjsonPaths: []
                    };
                });

            return Q.all(self.benchmarks
                .map(function(item) {
                    var level = self.getLevel(item),
                        block = self.getBlock(item);

                    return self.getBemjsonPathsByLevel(treeishPath, level, block)
                        .then(function(paths) {
                            benchmarks.forEach(function(subItem) {
                                if (subItem.level === level) {
                                    paths.forEach(function(path) {
                                        if(!~subItem.bemjsonPaths.indexOf(path)) {
                                            subItem.bemjsonPaths.push(path);
                                        }
                                    });
                                }
                            });
                        });
                }))
                .then(function() {
                    return benchmarks;
                });

        }
        
        return Q.all(self.getBenchLevelsByPath(treeishPath)
            .map(function(level) {
                return self.getBemjsonPathsByLevel(treeishPath, level)
                    .then(function(paths) {
                        return {
                            'level': level,
                            'bemjsonPaths': paths
                        };
                    });
            }));

    },


    /**
     * Return level for path
     * 
     * @param  {String} path path to block or level, like 'desktop.benchmarks:block_name'
     * @return {String}      level path, like - 'desktop.benchmarks'
     */
    getLevel: function(path) {
        return path.split(':')[0];
    },

    /**
     * Return block name for path
     * 
     * @param  {String} path path to block, like 'desktop.benchmarks:block_name'
     * @return {String}      block name, like - 'block_name'
     */
    getBlock: function(path) {
        return path.split(':')[1];
    },

    /**
     * Return all full paths to bemjson.js files on specific level
     * 
     * @param  {String} projectPath path to project root
     * @param  {String} level       level path
     * @return {String[]}           full bemjson paths             
     */
    getBemjsonPathsByLevel: function(projectPath, level, block) {
        var levelInstance = LEVEL.createLevel(PATH.join(projectPath, level));

        return Q.when(levelInstance.scanFiles())
            .then(function(files) {
                return Object.keys(files)
                    .reduce(function(paths, treeNode) {
                        var bemjsonItems = files[treeNode]['bemjson.js'] || [];
                        return bemjsonItems.concat(paths);
                    }, []);
            })
            .then(function(paths) {
                var filtered = [];

                if (block) {
                    paths.every(function(path) {
                        var currentBlock = path.file.replace('.bemjson.js', '');
                        if (currentBlock === block) {
                            filtered = [path];
                            return false;
                        }
                        return true;
                    });
                } else {
                    filtered = paths;
                }

                return filtered
                    .map(function(path) {
                        return path.absPath;
                    });
            });
    },

    /**
     * Make one target and return all links on blocks
     *
     * @param  {String} target  Path to target
     * @return {Array}  All links of target
     */
    makeTarget: function(target) {

        var self = this,
            targets = self.getBenchLevelsByPath(PATH.join(self.pathTmp, target)),
            label = '[' + target.green + '] has been assembled',
            script = require(PATH.join(process.cwd(), self.pathTmp, target, 'package.json')).scripts,
            defaultMake = 'npm install && bem make',
            make = null,
            envClone = Object.create(process.env);

        if (self.benchmarks && self.benchmarks.length) {
            targets = self.benchmarks
                .map(function(target) {
                    return target.replace(':', '/');
                });
        }

        if(script && script['bem-bench-build']) {
            make = script['bem-bench-build'];
            if (/\$targets/.test(make)) {
                if (!self.benchmarks) {
                    LOGGER.warn('$targets'.blue + ' not been defined through arguments');
                    LOGGER.warn('$targets'.blue + ' change to ' + targets);
                }
                make = make.replace('$targets', targets.join(' '));
            }
        } else {
            make = defaultMake + ' ' + targets.join(' ');
        }

        LOGGER.info('MAKE STRING [' + target.green + ']:\n', make.replace(/&&/gi, '&&\n'.green).underline);

        envClone.PATH = PATH.join(process.cwd(), 'node_modules/.bin') + ':' + process.env.PATH;

        LOGGER.time(label);
        return U.exec(make, {
                cwd: PATH.join(self.pathTmp, target),
                env: process.env
            })
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
        return Q.all(targets
            .map(this.makeTarget.bind(this))).thenResolve();
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
     * @param  {Object} links Links to source bemjson files
     * @param  {String} target  Revision name
     * @return {Promise * Object}  Object with tests results
     */
    runBenchmark: function(links, target) {

        var self = this;

        return Q.all(links
            .map(function(level) {

                return Q.all(level.bemjsonPaths
                    .map(function(link) {
                 
                        var def = Q.defer(),
                            bemjson = FS.readFileSync(link , 'UTF-8'),
                            res = VM.runInContext(bemjson, VM.createContext({}), link),
                            bemhtml = link.replace(/.bemjson.js/, '.bemhtml.js'),
                            bh = link.replace(/.bemjson.js/, '.bh.js'),
                            name = link.match(/([^\/]+)$/)[0],
                            nameShort = name.replace('.bemjson.js',''),
                            fullName = PATH.join(level.level, nameShort),
                            suite = new BENCHMARK.Suite(),
                            results = [],
                            isBh = false,
                            isBemhtml = false,

                            label = '[' + target.green + ' => ' + fullName.magenta + '] has been tested';


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
                            suite.add(fullName + '(bh)'.underline, function() {
                                bh.INST.apply(res);
                            });
                        }

                        if (isBemhtml) {
                            suite.add(fullName + '(bemhtml)'.underline, function() {
                                bemhtml.BEMHTML.apply(res);
                            });
                        }

                        suite
                            .on('cycle', function(event) {
                                results.push({
                                    name : String(event.target.name),
                                    hz   : Number(Math.round(event.target.hz) / 1000).toFixed(1),
                                    rme  : Number(event.target.stats.rme).toFixed(1),
                                    runs : event.target.stats.sample.length,
                                    isSeparator : isBemhtml && isBh
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
                    }));

        }))
        .then(function(rs) {
            var objs = [target];

            rs.forEach(function(i) {
                i.forEach(function(j) {
                    objs = objs.concat(j);
                });
            });

            return objs;
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
            levels = this.getBenchLevelsByPath(PATH.join(this.pathTmp, source)),

            onFail = function(err) {
                LOGGER.error('cloneBenchmarks - '.blue + err);
                return Q.reject(err);
            };

        if (search !== -1) {
            targets.splice(search, 1);
        }

        return Q.all(targets.map(function(target) {

            return Q.all(levels
                .map(function(level) {
                    var cmd = 'rm -rf ' + PATH.join(self.pathTmp, target, level);
                    return U.exec(cmd)
                        .fail(onFail)
                        .then(function() {

                            var dest = PATH.join(self.pathTmp, target),
                                cmd = ['cp', '-R', PATH.join(self.pathTmp, source, level), dest].join(' ');

                            return U.exec(cmd)
                                .fail(onFail);

                        });
                }));
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
     * Get all levels of benchmarks tech
     * 
     * @param  {String} path to level
     * @return {Array}      array of levels
     */
    getBenchLevelsByPath: function(path) {
        var level = LEVEL.createLevel(path);
        
        return level.getItemsByIntrospection()
            .filter(function(item) {
                return item.tech === 'benchmarks';
            })
            .map(function(item) {
                return level.getRelByObj(item) + item.suffix;
            });
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
            bcsInclude = 'Include ' + String(self.pathSelf).magenta,
            bcsExclude = 'Exclude ' + String(self.pathSelf).magenta,
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

                            LOGGER.info('Export...');
                            return Q.all(exports)
                                .then(function() {
                                    LOGGER.info('Export end');
                                    return self.getLatestTreeish()
                                        .then(function(rev) {
                                            LOGGER.info('Cloning benchmarks');
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

                        return self.getBenchmarksPaths(PATH.join(self.pathTmp, target))
                            .then(function(links) {
                                self.activeWait(self.DELAY);
                                return self.runBenchmark(links, target);
                            });

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
