var Q           = require('q'),
    COLORS      = require('colors'),
    BENCHMARK   = require('benchmark'),
    FS          = require('fs'),
    VM          = require('vm'),
    PATH        = require('path'),
    CP          = require('child_process'),
    TABLE       = require('cli-table'),
    INHERIT     = require('inherit'),
    LOGGER      = require('./logger'),
    LEVEL       = require('./level'),
    U           = require('./util');

/**
 * Benchmark - testing on speed  BEMHTML templates between revision
 */
var Benchmark = INHERIT({

    __constructor : function(opts, args){

        this.pathTmp        = 'bench/';
        this.pathSelf       = 'current_state';
        this.pathBenchmarks = 'benchmark.bundles';
        this.treeishList    = args['treeish-list'];
        this.latestRevision = 'undef';
        this.withCurrent    = opts['no-wc'];
        this.noMake         = opts['no-make'];
        this.benchmarks     = opts.benchmarks;

        this.treeishListChecked = [];
        this.benchmarkNoFounded = [];

        this.DELAY             = opts['delay'] ? opts['delay'] : 20;
        this.WARMIN_CYCLE      = 100;
        this.ALLOWABLE_PERCENT = opts['delta-rme'] ? opts['delta-rme'] : 5;
    },

    /**
     * Extract one revision to pathTmp folder
     * 
     * @param  {String} treeish | hash, HEAD, tag...
     * @return {String} | path to temporary revision
     */
    gitIterator : function(treeish) {

        var self = this,
            def = Q.defer(),
            errChunk = '',
            extract,
            archive;

        LOGGER.time('Create revision [' + treeish.green + ']');

        archive = CP.spawn('git', ['archive','--format=tar', '--prefix=' + this.pathTmp + '/' + treeish + '/', treeish]);
        extract = CP.spawn('tar', ['-x']);

        archive.stdout.on('data', function(data) {
            extract.stdin.write(data);
        });

        archive.stderr.on('data', function(err) {
            errChunk += err.toString().replace(/(\n)$/,'');
        });

        archive.on('close', function(code){
            if (code !== 0) {
                LOGGER.warn('gitIterator - '.blue + '[' + treeish.green + '] ' + errChunk);
                def.resolve();
            } else {
                LOGGER.timeEnd('Create revision [' + treeish.green + ']');
                def.resolve(treeish);
            }
            extract.stdin.end();
        });

        return def.promise;

    },

    /**
     * Copy current files state with exclude 
     * 
     * @return {String} | promise with path to files
     */
    backupSelf : function() {
        var self = this,
            def  = Q.defer(),
            err_chunk = '',
            rsync;

        LOGGER.time('Create revision [' + self.pathSelf.green + ']');

        rsync = CP.spawn('rsync', ['-av','--exclude=node_modules','--exclude=bench','--exclude=bem-bl','--exclude=.git','.',self.pathTmp + self.pathSelf]);

        rsync.on('close', function(code){
            if(code !== 0) {
                LOGGER.error('backupSelf - '.blue + 'Code:' + code + '\n' + err_chunk);
            } else {
                LOGGER.timeEnd('Create revision [' + self.pathSelf.green + ']');
                def.resolve(self.pathSelf);
            }
        });
        return def.promise;
    },

    /**
     * Getting all paths to .bemjson.js file on needed level
     * 
     * @param  {String} level_path | level path
     * @return {Array} | array of links
     */
    getBemjsonPath : function(treeshPath, levelPath) {

        var self = this,
            level =  LEVEL.createLevel(treeshPath + levelPath),
            bemjsonFiles = [],
            benchmarks;

        if (self.benchmarks && self.benchmarks.length) {
            // if -b flag detected then compare not all benchmarks
            benchmarks = self.benchmarks
                .map(function(b) {
                    return { block: b };
                });
        }
        else {
            // if -b flag not detected then all benchmarks
            benchmarks = level.getItemsByIntrospection()
                .filter(function(item) {
                    return item.tech == 'bemjson.js';
                });
        }

        benchmarks.forEach(function(benchmark) {
            var path = level.getPath(level.getByObj(benchmark), 'bemjson.js');
            if (FS.existsSync(path)) {
                bemjsonFiles.push(path);
            }
            else if (self.benchmarkNoFounded.indexOf(benchmark) === -1) {
                self.benchmarkNoFounded.push(benchmark);
            }
        });

        return U.arrayUnique(bemjsonFiles);

    },

    /**
     * Make one target and return all links on blocks
     * 
     * @param  {String} target | path to target
     * @return {Array} | all links of target
     */
    maker : function(target) {
        var self = this,
            def  = Q.defer(),
            pt = [],
            cmd  = 'cd ' + self.pathTmp + target + ' && bem make ' + self.pathBenchmarks;

        if(self.benchmarks) {
            self.benchmarks.forEach(function(benchmark) {
                pt += self.pathBenchmarks + '/' + benchmark + ' ';
            });
            cmd = 'cd ' + self.pathTmp + target + ' && bem make ' + pt;
        }

        CP.exec(cmd, function(err, stdout, stderr) {
            if (err) {
                def.reject(err);
            } else {
                def.resolve(self.getBemjsonPath(self.pathTmp + target + '/' , self.pathBenchmarks));
            }
        });
        return def.promise;
    },

    /**
     * Make all targets and run benchmarks for each target
     * 
     * @param  {Array} targets | list of targets
     * @return {Object} | objects with results of tests
     */
    make : function(targets) {

        var self = this;

        return Q.all(targets.map(function(target) {
            LOGGER.time('[' + target.green + '] has been assembled');
            return self.maker(target)
                .then(function(links) {
                    LOGGER.timeEnd('[' + target.green + '] has been assembled');
                    return [target].concat(links);
                })
                .fail(function(err) {
                    // TODO: fail on failed bem make
                    LOGGER.warn(target.red + ' not maked');
                });
        }))
        .then(function(links_pack) {
            if (self.benchmarkNoFounded) {
                self.benchmarkNoFounded.forEach(function(benchmark) {
                    LOGGER.warn('benchmark - ' + benchmark.red + ' not founded!');
                });
            }

            LOGGER.info('Benchmark... ');
            return Q.all(links_pack.map(function(pack){
                var links = pack.slice(1),
                    trg = pack[0];

                self.activeWait(self.DELAY);

                return self.bench(links, trg);

            }));
        });

    },

    /**
     * Activa waiting
     * 
     * @param  {Number} seconds | time in seconds for waiting
     * @return {Promise * Undefined}
     */
    activeWait : function(seconds) {
        if (seconds == 0) {
            return;
        }
        var dt = new Date().getTime(),
            title = seconds + 'sec';

        LOGGER.info('Wait ' + title.red);
        while(dt + (seconds * 1000) > new Date().getTime()){}
    },

    /**
     * Running all benchmarks of one target
     * 
     * @param  {Array} links | links to source bemjson tree
     * @param  {String} target | revision name
     * @return {Object} | objects with results of test
     */
    bench : function(links, target) {

        var self = this;

        return Q.all(links.map(function(link) {

            var def = Q.defer(),
                bemjson = FS.readFileSync(link , 'UTF-8'),
                bemhtml = require(link.replace(/.bemjson.js/, '.bemhtml.js')),
                context = VM.createContext({}),
                res = VM.runInContext(bemjson, context, link),
                name = link.match(/([^\/]+)$/)[0],
                name_short = name.replace('.bemjson.js',''),
                suite = new BENCHMARK.Suite();

            LOGGER.time('[' + target.green + ' => ' +name_short.blue+ '] has been tested');

            //Warmin-up for best results
            (function() {
                var i = self.WARMIN_CYCLE;
                while(i--) bemhtml.BEMHTML.apply(res);
            })();

            suite.add(name, function() {
                bemhtml.BEMHTML.apply(res);
            })
            .on('complete', function(event) {
                LOGGER.timeEnd('[' + target.green + ' => ' +name_short.blue+ '] has been tested');
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
    backupRevision : function() {
        var self = this;

        return self.treeishList.map(function(treeish) {
            return self.gitIterator(treeish)
                .then(function(res) {
                    if (res) {
                        self.treeishListChecked.push(res);
                    }
                });
        });
    },

    /**
     * Clone benchmark from path to all revision
     * 
     * @param  {String} path | path to benchmarks source
     * @return {Promise * Undefined}
     */
    benchmarksCloner : function(path) {

        var self = this,
            targets = this.treeishList,
            cmd,
            search;

        search = targets.indexOf(path);

        if (search !== -1) {
            targets.splice(search, 1);
        }

        return Q.all(targets.map(function(target) {
            var def = Q.defer();
            cmd = 'rm -rf ' + PATH.join(self.pathTmp, target, self.pathBenchmarks);

            CP.exec(cmd, function(err, stdout, stderr) {
                if (err) {
                    LOGGER.error('benchmarksCloner - '.blue + err);
                    def.reject(cmd);
                } else {
                    def.resolve();
                }
            });
            return def.promise;
        }))
        .then(function() {
            return Q.all(targets.map(function(target) {
                var def = Q.defer();
                cmd = 'cp -R ' + PATH.join(self.pathTmp, (self.withCurrent ? self.latestRevision : self.pathSelf),
                    self.pathBenchmarks + '* ' + self.pathTmp, target, self.pathBenchmarks);

                CP.exec(cmd, function(err, stdout, stderr) {
                    if (err) {
                        LOGGER.error('benchmarksCloner - '.blue + err);
                        def.reject(err);
                    } else {
                        def.resolve();
                    }
                });
                return def.promise;
            }));
        });

    },

    /**
     * Return latest treeish compared at date
     * 
     * @return {String} | latest treeish
     */
    getLatestTreeish : function() {

        var cmd,
            self = this,
            max_time = 0,
            last_treeish,
            time;

        if (!self.withCurrent) {
            LOGGER.info('Latest revision is -',self.pathSelf.magenta);
            self.latestRevision = self.pathSelf;
            return self.pathSelf;
        }

        return Q.all(self.treeishListChecked.map(function(treeish) {
            var def = Q.defer();
            cmd = "git show " + treeish + " | grep Date | awk -F':   ' '{print $2}'";

            CP.exec(cmd, function(err, stdout, stderr) {
                if (err) {
                    console.log(err);
                } else {
                    def.resolve({
                        'treeish':treeish,
                        'date':stdout.replace('\n','')
                    });
                }
            });

            return def.promise;
        }))
        .then(function(dates) {
            dates.forEach(function(dt) {
                var time = new Date(dt.date).getTime();
                if (time > max_time) {
                    max_time = time;
                    last_treeish = dt.treeish;
                }
            });
            self.latestRevision = last_treeish; /*save to public var*/
            LOGGER.info('Latest revision is - ' + last_treeish.magenta);
            return last_treeish; /*not used*/
        });
    },

    /**
     * Sort results by command line order
     * 
     * @param  {Object} res | results data 
     * @return {Object} | sorted results data
     */
    sortResult : function(res) {
        var sorted = [],
            source = [];

        if (!this.noMake) {
            source = this.treeishListChecked.reverse();
        } else {
            source = this.treeishList;
        }

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
     * Draw table with results on screen(cli)
     * 
     * @param  {Objects} results | objects with results
     * @return {Object} | formated cli table
     */
    generateTable : function(results) {

        var sortedRes = this.sortResult(results),
            header = [],
            data = [],
            tmp_arr = [],
            rme = [],
            name,
            sq,
            curr,
            stat,
            max,
            min,
            perc,
            table;

        header.push(
            '№'.magenta,
            'benchmark'.yellow.underline
        );

        sortedRes.forEach(function(item) {
            header.push(item[0].blue + '(hz/rme)'.cyan);
        });

        for (var i = 1; i < sortedRes[0].length; i += 1) {
            name = undefined;
            t = [];
            rme = [];

            for (var j = 0; j < sortedRes.length; j++) {
                if (!name) name = sortedRes[j][i].name;

                if(sortedRes[j][i]) {
                    t.push('['+sortedRes[j][i].hz.green + '] ±' + sortedRes[j][i].rme.magenta + '%');
                    rme.push(Number(sortedRes[j][i].rme));
                } else {
                    t.push('none');
                }
            }

            max = Math.max.apply(null,rme);
            min = Math.min.apply(null,rme);

            if( (max - min) < this.ALLOWABLE_PERCENT) {
                perc = 'stable'.yellow.underline;
            } else {
                perc = 'unstable'.red.underline;
            }

            data.push( [i,name.replace('.bemjson.js','')].concat(t).concat(perc));
        }

        header.push('RME stat'.magenta);

        table = new TABLE({
                head: header,
                style : {compact : true, 'padding-left' : 1, 'padding-right':1}
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
    cleaner : function() {
        LOGGER.info('Cleaning a TMP folder');
        LOGGER.time('TMP folder has been cleaned');

        var cmd = 'rm -rf ./' + this.pathTmp + '*',
            def = Q.defer();

        CP.exec(cmd, function(err, stdout, stderr) {
            if (err) {
                def.reject(err);
            } else {
                def.resolve();
                LOGGER.timeEnd('TMP folder has been cleaned');
            }
        });

        return def.promise;
    },

    /**
     * Main flow
     * 
     * @return {Promise} | primise for COA
     */
    start : function() {

        var self = this,
            def  = Q.defer(),
            allBeckups,
            allMakes;

        LOGGER.time('All time');

        if (!self.noMake) {
            Q.when(self.cleaner())
                .then(function(){
                    // Chain beckup - beck up needed revision + current files state
                    if (!self.withCurrent) {
                        LOGGER.info('Include ' + 'current_state'.magenta);
                        allBeckups = [self.backupSelf()].concat(self.backupRevision());
                    } else {
                        LOGGER.info('Exclude ' + 'current_state'.magenta);
                        allBeckups = self.backupRevision();
                    }

                    return Q.all(allBeckups)
                        .then(function() {
                            if (!self.withCurrent) {
                                self.treeishListChecked = self.treeishListChecked.concat(self.pathSelf);
                            }
                        })
                        .then(function() {
                            return Q.when(self.getLatestTreeish());
                        })
                        .then(function() {
                            return self.benchmarksCloner(self.latestRevision);
                        })
                        .then(function() {
                            LOGGER.info('Make...');
                            return self.make(self.treeishListChecked);
                        }).then(function(tableRs) {
                            LOGGER.timeEnd('All time');
                            console.log(self.generateTable(tableRs).toString());
                        }).done();
                });
        } else {
            // without make
            LOGGER.info('[ONLY BENCHMARKS]'.magenta + ' mode');

            if (!self.withCurrent) {
                LOGGER.info('Include ' + 'current_state'.magenta);
                self.treeishList = [self.pathSelf].concat(self.treeishList);
            } else {
                LOGGER.info('Exclude ' + 'current_state'.magenta);
            }

            return Q.all(self.treeishList.map(function(target) {
                return Q.resolve([target].concat(self.getBemjsonPath(self.pathTmp + target + '/' , self.pathBenchmarks)));
            }))
            .then(function(linksPack) {
                LOGGER.info('Benchmark...');
                return Q.all(linksPack.map(function(pack){
                var links  = pack.slice(1),
                    trg = pack[0];

                self.activeWait(self.DELAY);

                return self.bench(links, trg);
                }));
            })
            .then(function(tableRs) {
                LOGGER.timeEnd('All time');
                console.log(self.generateTable(tableRs).toString());
            });
        }

    }

});

/**
 * Create instance on Benchmark and share it
 * 
 * @param  {Array} opts | options from COA
 * @param  {Array} args | arguments from COA
 * @return {Object}     | Benchmark
 */
module.exports = function(opts, args) {
    return new Benchmark(opts, args);
};
