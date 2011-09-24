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
            .act(function() {
                return this.resolve(JSON.parse(
                    require('fs').readFileSync(
                        myPath.join(__dirname, '../package.json')))
                            .version);
            })
            .end()
        //.cmd().name('decl').apply(require('./commands/decl').COA).end()
        //.cmd().name('build').apply(require('./commands/build').COA).end()
        .cmd().name('create').apply(require('./commands/create')).end()
        .run(process.argv.slice(2));
};
