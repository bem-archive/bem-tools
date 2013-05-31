var Q           = require('q'),
    COLORS      = require('colors'),
    FS          = require('fs'),
    BENCHMARK   = require('benchmark'),
    VM          = require('vm');
    UTIL        = require('./util'),
    CHILD_PROC  = require('child_process'),
    LEVEL       = require('./level'),
    TABLE      = require('cli-table'),
    LOGGER      = require('./logger');

/**
 * BemBenchmark - testing on speed  BEMHTML templates between revision
 */
function BemBenchmark(opts, args){

    this.PATH_TMP        = 'bench/';
    this.PATH_SELF       = 'current_state';
    this.PATH_BENCHMARKS = 'benchmark.bundles';
    this.TREEISH_LIST    = args['treeish-list'];
    this.LATEST_REVISION = 'undef';
    this.WITH_CURRENT    = opts['without-current-state'];
    this.BENCHMARKS      = opts.benchmarks;
    this.TREEISH_LIST_CHECKED = [];
    this.BENCHMARK_NOTFOUNDED = [];
}


/**
 * Extract one revision to PATH_TMP folder
 * 
 * @param  {String} treeish | hash, HEAD, tag...
 * @return {String}         | path to temporary revision
 */
BemBenchmark.prototype.gitIterator = function(treeish) {

    var self = this,
        def = Q.defer(),
        err_chunk = '',
        extract,
        archive;

    archive = CHILD_PROC.spawn('git', ['archive','--format=tar', '--prefix=' + this.PATH_TMP + '/' + treeish + '/', treeish]);
    extract = CHILD_PROC.spawn('tar', ['-x']);

    archive.stdout.on('data', function(data) {
        extract.stdin.write(data);
    });

    archive.stderr.on('data', function(err) {
        err_chunk += err.toString().replace(/(\n)$/,'');
    });

    archive.on('close', function(code){
        if (code !== 0) {
            LOGGER.warn('gitIterator - '.blue + '[' + treeish.green + '] ' + err_chunk);
            def.resolve();
        } else {
            def.resolve(treeish);
        }
        extract.stdin.end();
    });

    return def.promise;
};

/**
 * Copy current files state with exclude 
 * 
 * @param none
 * @return {String} | promise with path to files
 */
BemBenchmark.prototype.backupSelf = function() {

    var self = this,
        def  = Q.defer(),
        err_chunk = '',
        tar,
        extract;


    mkdir   = CHILD_PROC.spawn('mkdir', ['-p', self.PATH_TMP + self.PATH_SELF]);
    tar     = CHILD_PROC.spawn('tar', ['--exclude=./bench/', '--exclude=./node_modules/', '-f', '-', '-c', '.']);
    extract = CHILD_PROC.spawn('tar', ['-C', self.PATH_TMP + self.PATH_SELF, '-f', '-', '-x']);

    tar.stdout.on('data', function(data) {
        extract.stdin.write(data);
    });

    tar.stderr.on('data', function(err) {
        err_chunk += err.toString().replace(/(\n)$/,'');
    });

    tar.on('close', function(code) {
        if(code !== 0) {
            LOGGER.error('beckupSelf - '.blue + 'Code:' + code + '\n' + err_chunk);
            //def.reject(new Error('Code:'+code + '\n' + err_chunk));
        } else {
            LOGGER.info('Create revision [' + self.PATH_SELF.green + ']');
            def.resolve(self.PATH_SELF);
        }
        extract.stdin.end();
    });
    return def.promise;
};

/**
 * Getting all paths to .bemjson.js file on needed level
 * 
 * @param  {String} level_path | level path
 * @return {Array} | array of links
 */
BemBenchmark.prototype.getBemjsonPath = function(treesh_path, level_path) {

    var self = this,
        level =  LEVEL.createLevel(treesh_path + level_path),
        bemjson_files = [],
        bem_entities;

    // if -b flag detected then compare not all benchmarks
    if (self.BENCHMARKS !== undefined) {
        self.BENCHMARKS.forEach(function(benchmark) {
            path = level.getPath(level.getByObj({block:benchmark}), 'bemjson.js');
            if (FS.existsSync(path)) {
                bemjson_files.push(path);
            } else {
                if (self.BENCHMARK_NOTFOUNDED.indexOf(benchmark) === -1) {
                    self.BENCHMARK_NOTFOUNDED.push(benchmark);
                }
            }
        });
        return UTIL.arrayUnique(bemjson_files);
    }

    // if -b flag not detected then all benchmarks
    try {
        bem_entities = level.getItemsByIntrospection();
    } catch(e) {
        throw new Error(e);
    }

    if (bem_entities) {
         bem_entities.forEach(function(entity){
            path = level.getPath(level.getByObj({block:entity.block}), 'bemjson.js');
            if (FS.existsSync(path)){
                bemjson_files.push(path);
            } else {
                if (self.BENCHMARK_NOTFOUNDED.indexOf(benchmark) === -1) {
                    self.BENCHMARK_NOTFOUNDED.push(benchmark);
                }
            }
        });
    }
    return UTIL.arrayUnique(bemjson_files);
};


/**
 * Make one target and return all links on blocks
 * 
 * @param  {String} target | path to target
 * @return {Array} | all links of target
 */
BemBenchmark.prototype.maker = function(target) {

    var self = this,
        def  = Q.defer(),
        pt = [],
        cmd  = 'cd ' + self.PATH_TMP + target + ' && bem make ' + self.PATH_BENCHMARKS;

    if(self.BENCHMARKS) {
        self.BENCHMARKS.forEach(function(benchmark) {
            pt += self.PATH_BENCHMARKS + '/' + benchmark + ' ';
        });
        cmd = 'cd ' + self.PATH_TMP + target + ' && bem make ' + pt;
    }

    CHILD_PROC.exec(cmd, function(err, stdout, stderr) {
        if (err) {
            def.reject(err);
        } else {
            def.resolve(self.getBemjsonPath(self.PATH_TMP + target + '/' , self.PATH_BENCHMARKS));
        }
    });
    return def.promise;
};


/**
 * Make all targets and run benchmarks for each target
 * 
 * @param  {Array} targets | list of targets
 * @return {Object} | objects with results of tests
 */
BemBenchmark.prototype.make = function(targets) {

    var self = this;

    return Q.all(targets.map(function(target) {
        LOGGER.info('Making [' + target.cyan + '] ...');
        return self.maker(target)
            .then(function(links) {
                LOGGER.info('[' + target.green + '] make done');
                return [target].concat(links);
            })
            .fail(function(err) {
                LOGGER.warn(target.red + ' not maked');
            });
    }))
    .then(function(links_pack) {
        LOGGER.info('Making end');

        if (self.BENCHMARK_NOTFOUNDED) {
            self.BENCHMARK_NOTFOUNDED.forEach(function(benchmark) {
                LOGGER.warn('benchmark - ' + benchmark.red + ' not founded!');
            });
        }

        LOGGER.info('Run testing:');
        return self.benchmarksCloner(self.LATEST_REVISION)
            .then(function() {
                return Q.all(links_pack.map(function(pack){
                var links  = pack.slice(1);
                    trg = pack[0];

                return self.bench(links, trg)
                    .then(function(res) {
                        LOGGER.info('[' + res[0].green + '] tested');
                        return res;
                    });
                }));
            });
    });
};

/**
 * Running all benchmarks of one target
 * 
 * @param  {Array} links | links to source bemjson tree
 * @param  {String} target | revision name
 * @return {Object} | objects with results of test
 */
BemBenchmark.prototype.bench = function(links, target) {

    //console.log('benchmark => ', target);
    LOGGER.info('Run test on [' + target.cyan + '] ...');

    return Q.all(links.map(function(link) {

        var def = Q.defer(),
            bemjson = FS.readFileSync(link , 'UTF-8'),
            bemhtml = require(link.replace(/.bemjson.js/, '.bemhtml.js')),
            context = VM.createContext({}),
            res = VM.runInContext(bemjson, context, link),
            name = link.match(/([^\/]+)$/)[0],
            suite = new BENCHMARK.Suite();

        suite.add(name, function() {
            bemhtml.BEMHTML.apply(res);
        })
        .add(name, function() {
            bemhtml.BEMHTML.apply(res);
        })
        .on('complete', function(event) {
            def.resolve({
                'name' : String(event.target.name),
                'hz'   : Number(Math.round(event.target.hz) / 1000).toFixed(1),
                'rme'  : Number(event.target.stats.rme).toFixed(1),
                'runs' : event.target.stats.sample.length
            });
        })
        .run({ 'async': true });

        return def.promise;
    }))
    .then(function(res) {
        return [target].concat(res);
    });
};

/**
 * Extract all revisions and mark that it exist
 * 
 * @return {} | none
 */
BemBenchmark.prototype.beckupRevision = function() {

    var self = this;

    return self.TREEISH_LIST.map(function(treeish) {
        return self.gitIterator(treeish)
            .then(function(res) {
                if (res) {
                    LOGGER.info('Create revision [' + res.green + ']');
                    self.TREEISH_LIST_CHECKED.push(res);
                }
            });
    });
};

/**
 * Clone benchmark from path to all revision
 * 
 * @param  {String} path | path to benchmarks source
 * @return {Promise} | when all done
 */
BemBenchmark.prototype.benchmarksCloner = function(path) {

    var self = this,
        targets = this.TREEISH_LIST,
        cmd,
        search;

    search = targets.indexOf(path);

    if (search !== -1) {
        targets.splice(search, 1);
    }

    return Q.all(targets.map(function(target) {

        var def = Q.defer();
        cmd = 'rm -rf ' + self.PATH_TMP + target + '/' + self.PATH_BENCHMARKS;

        CHILD_PROC.exec(cmd, function(err, stdout, stderr) {
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
            cmd = 'cp -R ' + self.PATH_TMP + (self.WITH_CURRENT ? self.LATEST_REVISION : self.PATH_SELF) +
                '/' + self.PATH_BENCHMARKS + '* ' + self.PATH_TMP + target + '/' + self.PATH_BENCHMARKS;

            CHILD_PROC.exec(cmd, function(err, stdout, stderr) {
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
};


/**
 * Return latest treeish compared at date
 * 
 * @return {String} | treeish
 */
BemBenchmark.prototype.getLatestTreeish = function() {

    var cmd,
        self = this,
        max_time = 0,
        last_treeish,
        time;

    if (!self.WITH_CURRENT) {
        LOGGER.info('Latest revision is -',self.PATH_SELF);
        self.LATEST_REVISION = self.PATH_SELF;
        return self.PATH_SELF;
    }

    return Q.all(self.TREEISH_LIST_CHECKED.map(function(treeish) {

        var def = Q.defer();
        cmd = "git show " + treeish + " | grep Date | awk -F':   ' '{print $2}'";

        CHILD_PROC.exec(cmd, function(err, stdout, stderr) {
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
        self.LATEST_REVISION = last_treeish; /*save to public var*/
        LOGGER.info('Tatest revision is - ' + last_treeish.magenta);
        return last_treeish; /*not used*/
    });
};

/**
 * Drow table with results on screen(cli)
 * 
 * @param  {Objects} results | objects with results
 * @return {none}
 */
BemBenchmark.prototype.generateTable = function(results) {

    var header = [],
        data = [],
        tmp_arr = [],
        name;

    header.push(
        '№'.magenta,
        'benchmark'.red.underline
    );

    results.forEach(function(item) {
        header.push(item[0].red);
    });

    for (var i = 1; i < results[0].length; i += 1) {

        name = undefined;
        t = [];

        for (var j = 0; j < results.length; j++) {
            if (!name) name = results[j][i].name;
            t.push('['+results[j][i].hz.green + ']±' + results[j][i].rme.magenta + '%' + ' - ' + results[j][i].runs+'r');
        }
        data.push( [i,name].concat(t).concat(['good']) ); // status ?
    }


    header.push('status'.magenta);

    var table = new TABLE({
            head: header,
            style : {compact : true, 'padding-left' : 1, 'padding-right':1}
        });

    data.forEach(function(row) {
        table.push(row);
    });

    console.log(table.toString());
};

/**
 * Main flow
 * 
 * @return {Promise} | primise for COA
 */
BemBenchmark.prototype.start = function() {

    var self = this,
        def  = Q.defer(),
        allBeckups,
        allMakes;

    LOGGER.info('Preparing data:');

    // Chain beckup - beck up needed revision + current files state
    if (!self.WITH_CURRENT) {
        LOGGER.info('Working with ' + 'CURRENT_STATE'.magenta);
        allBeckups = [self.backupSelf()].concat(self.beckupRevision());
    } else {
        LOGGER.info('Working without ' + 'CURRENT_STATE'.magenta);
        allBeckups = self.beckupRevision();
    }

    return Q.all(allBeckups)
        .then(function(res) {

            if (!self.WITH_CURRENT) {
                allMakes = [self.PATH_SELF].concat(self.TREEISH_LIST_CHECKED);
            } else {
                allMakes = self.TREEISH_LIST_CHECKED;
            }
            return Q.when(self.getLatestTreeish())
                .then(function() {
                    LOGGER.info('Preparing end');
                    LOGGER.info('Making all revision:');
                    return self.make(allMakes)
                        .then(function(res){
                            LOGGER.info('Testing end');
                            self.generateTable(res);
                        });
                });
        });
};

/**
 * Create instance on BemBenchmark and share it
 * 
 * @param  {Array} opts | options from COA
 * @param  {Array} args | arguments from COA
 * @return {Object}     | BemBenchmark
 */
module.exports = function(opts, args) {
    return new BemBenchmark(opts, args);
};