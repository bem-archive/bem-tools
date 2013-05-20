var cmd_exec  = require('child_process').exec,
    Q  = require('q'),
    colors = require('colors'),
    fs = require('fs');

function gitIterator (treeish) {
    var def = Q.defer(),
        sysfolder = 'bench/',
        cmd = 'git archive --format tar --prefix=' + sysfolder + '/' + treeish + '/ ' + treeish + ' | tar -x';

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

// Enter point
module.exports = function(opts, args){

    var treeish   = ['HEAD'].concat(args['treeish-list']);
    //var benchmarks = opts.benchmarks;

    return Q.all(treeish.map(function(trish) {
        return gitIterator( trish ) 
            .then(function(path_to_treeish) {
                console.log('git checkout: '.green, path_to_treeish.underline.green);
                
                var level = require('./level').createLevel(path_to_treeish + '/benchmark.bundles/');
                var path = level.getPath(level.getByObj({block:'b-link'}), 'bemjson.js');

                if(fs.existsSync(path)){
                    console.log(path);
                }
            });
    }));
};

