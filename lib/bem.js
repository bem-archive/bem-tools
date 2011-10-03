exports.main = function () {

    var myPath = require('./path');
    require('coa').Cmd()
        .name(myPath.basename(process.argv[1]))
        .title('Инструменты работы с файлами, написанными по БЭМ-методу.')
        .helpful()
        .opt()
            .name('version').title('Версия')
            .short('v').long('version')
            .flag()
            .only()
            .act(function() {
                return JSON.parse(require('fs').readFileSync(
                    myPath.join(__dirname, '..', 'package.json')))
                        .version;
            })
            .end()
        .cmd().name('decl').apply(require('./commands/decl')).end()
        .cmd().name('build').apply(require('./commands/build')).end()
        .cmd().name('create').apply(require('./commands/create')).end()
        .run();

};
