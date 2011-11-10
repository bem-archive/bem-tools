var Q = require('q'),
    CP = require('child_process'),
    PATH = require('./path');

module.exports = require('coa').Cmd()
    .name(PATH.basename(process.argv[1]))
    .title('Инструменты работы с файлами, написанными по БЭМ-методу.')
    .helpful()
    .opt()
        .name('version').title('Версия')
        .short('v').long('version')
        .flag()
        .only()
        .act(function() {
            return JSON.parse(require('fs').readFileSync(
                PATH.join(__dirname, '..', 'package.json')))
                    .version;
        })
        .end()
    .cmd().name('decl').apply(require('./commands/decl')).end()
    .cmd().name('build').apply(require('./commands/build')).end()
    .cmd().name('create').apply(require('./commands/create')).end()
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
            child.on('exit', function (code) {
                rl.prompt();
            });
        })
        .on('close', function() {
            console.log('');
            process.stdin.destroy();
            defer.resolve();
        });

        console.log("Type '--help' for help, press ctrl+d or ctrl+c to exit");
        rl.prompt();

        return defer.promise;
    });
