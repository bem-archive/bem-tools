exports.main = function () {
    require('./optparse').Cmd()
        .name(process.argv[1])
        .title('Инструменты работы с файлами, написанными по БЭМ-методу.')
        .helpful()
        .cmd().name('decl').apply(require('./commands/decl').OptParse).end()
        .cmd().name('build').apply(require('./commands/build').OptParse).end()
        .cmd().name('create').apply(require('./commands/create').OptParse).end()
        .parse(process.argv.slice(2));
};
