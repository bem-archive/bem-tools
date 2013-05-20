var cmd_exec  = require('child_process').exec;
var Q  = require('q');


// Namespace
var BENCH = {
    MODULES : {}
};


BENCH.MODULES.TreeishExtractor = (function(){

     // Private members and methods

     function gitIterator (treeish) {
        var def = Q.defer();
        var sysfolder = 'bench/';
        var cmd = 'git archive --format tar --prefix=' + sysfolder + '/' + treeish + '/ ' + treeish + ' | tar -x';

        cmd_exec(cmd, function(err, stdout, stderr) {
           if (stderr || err) {
                return def.reject( stderr || err );
           }
           def.resolve( sysfolder + treeish );
        });
        return def.promise;
    }

    function cleanUp () {
        cmd_exec('rm -rf tmp/*', function(err, strout, stderr) {
            console.log('all removed');
        });
    }

    // Public members and methods
    return {
        'cleanUp'     : cleanUp,
        'gitIterator' : gitIterator
    };

})();



// Enter point
module.exports = function(opts, args){

    var treeish   = ['HEAD'].concat(args['treeish-list']);
    //var benchmarks = opts.benchmarks;

    treeish.forEach(function(trish) {
        Q.when( BENCH.MODULES.TreeishExtractor.gitIterator( trish ) ).then(function(path_to_treeish) {
            console.log('git checkout: ',path_to_treeish);
        }).fail(function(err) {
            console.log('run.iteration.error: ',err);
        });
    });
};

