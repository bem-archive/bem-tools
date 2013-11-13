'use strict';

var Q = require('q'),
    CP = require('child_process'),
    PATH = require('./path'),
    insight = require('./insight');

Q.longStackJumpLimit = 0;

module.exports = require('coa').Cmd()
    .name(PATH.basename(process.argv[1]))
    .title(['Tools to work with files written using the BEM-method.', '' +
        'See http://bem.info/method/ for more info.'].join('\n'))
    .helpful()
    .extendable()
    .opt()
        .name('version').title('Show version')
        .short('v').long('version')
        .flag()
        .only()
        .act(function() {
            var p = require('../package.json');
            return p.name + ' ' + p.version;
        })
        .end()
    .cmd()
        .name('decl')
        .apply(insight.trackCommand)
        .apply(require('./commands/decl'))
        .end()
    .cmd()
        .name('build')
        .apply(insight.trackCommand)
        .apply(require('./commands/build'))
        .end()
    .cmd()
        .name('create')
        .apply(insight.trackCommand)
        .apply(require('./commands/create'))
        .end()
    .cmd()
        .name('make')
        .apply(insight.trackCommand)
        .apply(require('./commands/make'))
        .end()
    .cmd()
        .name('mv')
        .apply(insight.trackCommand)
        .apply(require('./commands/mv'))
        .end()
    .cmd()
        .name('server')
        .apply(insight.trackCommand)
        .apply(require('./commands/server'))
        .end()
    .completable()
    .act(function() {
        if (this.isCli) insight.track('interactive');
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
