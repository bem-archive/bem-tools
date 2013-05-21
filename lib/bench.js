var Q           = require('q'),
    Colors      = require('colors'),
    Fs          = require('fs'),
    Benchmark   = require('benchmark'),
    Util        = require('./util');

function gitIterator (treeish) {
    var def = Q.defer(),
        sysfolder = 'bench/',
        cmd = 'git archive --sformat tar --prefix=' + sysfolder + '/' + treeish + '/ ' + treeish + ' | tar -x';

    exec_command(cmd)
        .then(function(){
            def.resolve( sysfolder + treeish );
        })
        .fail(function(err){
            // err not return error code because pipi
        });

    return def.promise;
}

function cleanUp () {
    cmd_exec('rm -rf tmp/*', function(err, strout, stderr) {
        console.log('all removed');
    });
}

function exec_command(cmd) {
    var cmd_exec  = require('child_process').exec,
        def = Q.defer();

    cmd_exec(cmd, function(err, stdout, stderr) {
        if (err) {
            def.reject(err);
        } else {
            def.resolve();                 
        }
    });
    return def.promise;  
}

// Enter point
module.exports = function(opts, args){

    var treeish   = ['HEAD'].concat(args['treeish-list']); // need copy current files state
    //var benchmarks = opts.benchmarks;

    return Q.all(treeish.map(function(trish) {
        return gitIterator( trish ) 
            .then(function(path_to_treeish) {

                console.log('git checkout: '.green, path_to_treeish.underline.green);

                var cmd = 'cd ' + path_to_treeish + ' && bem make benchmark.bundles/';

                return exec_command(cmd)
                    .then(function(){
                        return path_to_treeish;
                    })
                    .fail(function(err){
                        return err;
                    });

            }).then(function(path_to_maked_treeish){

                var level,
                    bem_entities,
                    bemjson_files,
                    path;

                level = require('./level').createLevel(path_to_maked_treeish + '/benchmark.bundles/');

                try {
                    bem_entities = level.getItemsByIntrospection();
                } catch(e) {
                    throw new Error(e);
                }

                if(bem_entities) {
                    bemjson_files = util.arrayUnique(bem_entities.map(function(entity){
                        path = level.getPath(level.getByObj({block:entity.block}), 'bemjson.js');
                        if(fs.existsSync(path)){
                            return path;
                        }
                    }));
                }
                return bemjson_files;

            }).then(function(bemjson_files){

                var bemhtml = require( '../' + item + '.bemhtml.js' );
                var bemjson = fs.readFileSync( item + '.bemjson.js' , 'UTF-8');
                var context = vm.createContext({});
                var res = vm.runInContext(bemjson, context, 'bemjs');

                var suite = new Benchmark.Suite;
                // add tests
                suite.add('BEMHTML-1', function() {
                    bemhtml.BEMHTML.apply(res);       
                })
                .add('BEMHTML-2', function(){
                    bemhtml.BEMHTML.apply(res);       
                })
                .add('BEMHTML-3', function(){
                    bemhtml.BEMHTML.apply(res);       
                }) 
                // add listeners
                .on('cycle', function(event) {
                  console.log(String(event.target));
                })
                .on('complete', function() {
                  console.log('Fastest is ' + this.filter('fastest').pluck('name'));
                })
                // run async
                .run({ 'async': true });

            });
    }));
};
