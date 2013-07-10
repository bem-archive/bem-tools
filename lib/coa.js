'use strict';

var Q = require('q'),
    CP = require('child_process'),
    PATH = require('./path');

Q.longStackJumpLimit = 0;

module.exports = require('coa').Cmd()
    .name(PATH.basename(process.argv[1]))
    .title(['Tools to work with files written using the BEM-method.', '' +
        'See http://bem.github.com/bem-method/ for more info.'].join('\n'))
    .helpful()
    .opt()
        .name('version').title('Show version')
        .short('v').long('version')
        .flag()
        .only()
        .act(function() {
            return require('../package.json').version;
        })
        .end()
    .cmd().name('decl').apply(require('./commands/decl')).end()
    .cmd().name('build').apply(require('./commands/build')).end()
    .cmd().name('create').apply(require('./commands/create')).end()
    .cmd().name('make').apply(require('./commands/make')).end()
    .cmd().name('server').apply(require('./commands/server')).end()
    .cmd().name('bench').apply(require('./commands/bench')).end()
    .completable()
    .act(function() {
        var defer = Q.defer(),
            readline = require('readline'),
            rl = readline.createInterface(process.stdin, process.stdout),
            prefix = '> ';
        rl.setPrompt(prefix, prefix.length);

        rl.on('line', function(line) {
            line = line.trim();
            if (!line) {
                rl.prompt();
                return;
            }
            var child = CP.spawn(process.argv[0],
                process.argv.slice(1, 2).concat(line.split(' ')),
                { cwd: process.cwd(), customFds: [-1, 1, 2] });
            child.on('exit', function() {
                rl.prompt();
            });
        })
        .on('close', function() {
            console.log('');
            process.stdin.destroy();
            defer.resolve();
        });

        /* jshint -W109 */
        console.log("Type '--help' for help, press ctrl+d or ctrl+c to exit");
        /* jshint +W109 */
        rl.prompt();

        return defer.promise;
    });
