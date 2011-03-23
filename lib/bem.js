exports.main = function () {
    require('./optparse').Cmd()
        .name(process.argv[1])
        .title('Инструменты работы с файлами, написанными по БЭМ-методу.')
        .helpful()
        .opt()
            .name('version').short('v').long('version')
            .title('Версия')
            .type(Boolean)
            .end()
        .act(function(opts) {
            if(opts.version) {
                console.log(
                    JSON.parse(
                        require('fs').readFileSync(
                            require('./path').join(__dirname, '../package.json'))).version);
                this.exit();
            }
        })
        .cmd().name('decl').apply(require('./commands/decl').OptParse).end()
        .cmd().name('build').apply(require('./commands/build').OptParse).end()
        .cmd().name('create').apply(require('./commands/create').OptParse).end()
        .parse(process.argv.slice(2));
};
