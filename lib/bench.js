var Q           = require('q'),
    COLORS      = require('colors'),
    FS          = require('fs'),
    BENCHMARK   = require('benchmark'),
    VM          = require('vm');
    UTIL        = require('./util'),
    CHILD_PROC  = require('child_process'),
    LEVEL       = require('./level');

/**
 * BemBenchmark - testing on speed  BEMHTML templates between revision
 */
function BemBenchmark(opts, args){

    this.PATH_TMP     = 'bench/';
    this.PATH_SELF    = 'current_state';
    this.PATH_BENCHMARKS = 'benchmark.bundles/';
    this.TREEISH_LIST = args['treeish-list'];
    this.BENCHMARKS   = opts.benchmarks;
    this.TREEISH_LIST_CHECKED = [];
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
            console.log('gitIterator => '.red + '[' + treeish.green + '] ' + err_chunk);
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

    extract.stderr.on('data', function(data){
        console.log(data.toString());
    });

    tar.on('close', function(code) {
        if(code !== 0) {
            def.reject(new Error('Code:'+code + '\n' + err_chunk));
        } else {
            console.log('create revision:'.cyan.underline, self.PATH_SELF.green);
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

    var level =  LEVEL.createLevel(treesh_path + level_path),
        bem_entities,
        bemjson_files;

    try {
        bem_entities = level.getItemsByIntrospection();
    } catch(e) {
        throw new Error(e);
    }

    if(bem_entities) {
        bemjson_files = UTIL.arrayUnique(bem_entities.map(function(entity){
            path = level.getPath(level.getByObj({block:entity.block}), 'bemjson.js');
            if(FS.existsSync(path)){
                return path;
            }
        }));
    }
    return bemjson_files;
};


/**
 * Make one target and return all links on blocks
 * 
 * @param  {String} target | path to target
 * @return {Array} | all links of target
 */
BemBenchmark.prototype.maker = function(target) {

    var self = this,
        def = Q.defer(),
        cmd = 'cd ' + self.PATH_TMP + target + ' && bem make ' + self.PATH_BENCHMARKS;

    console.log('making:' + target.green);

    CHILD_PROC.exec(cmd, function(err, stdout, stderr) {
        if (err) {
            def.reject(err);
        } else {
            def.resolve(self.getBemjsonPath(self.PATH_TMP + target + '/' , self.PATH_BENCHMARKS));
            console.log('maked:' + target.green);
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
        return self.maker(target)
            .then(function(links) {
                return self.bench(links, target)
                    .then(function(res) {
                        return [target].concat(res);
                    });
            })
            .fail(function(err) {
                console.log(target + ' <= not maked');
                console.log(err);
            });
    }));
};

/**
 * Running all benchmarks of one target
 * 
 * @param  {Array} links | links to source bemjson tree
 * @param  {String} target | revision name
 * @return {Object} | objects with results of test
 */
BemBenchmark.prototype.bench = function(links, target) {

    console.log('benchmark => ', target);

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
        .on('complete', function(event) {
            //console.log(String(event.target));
            def.resolve({
                'name' : String(event.target.name),
                'hz' : Math.round(event.target.hz)
            });
        })
        .run({ 'async': true });

        return def.promise;
    }));
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
                    console.log('create revision:'.cyan.underline, res.green);
                    self.TREEISH_LIST_CHECKED.push(res);
                }
            });
    });
};

/**
 * Main flow
 * 
 * @return {Promise} | primise for COA
 */
BemBenchmark.prototype.start = function() {

    var self = this,
        def  = Q.defer(),
        allBeckups;

    // Chain beckup - beck up needed revision + current files state
    allBeckups = [self.backupSelf()].concat(self.beckupRevision());

    return Q.all(allBeckups)
        .then(function(res) {
            return self.make(self.TREEISH_LIST_CHECKED.concat(self.PATH_SELF))
                .then(function(res){
                    console.log(res);
                    console.log('end all flow');
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