exports.OptParse = function() {
    return this
        .title('Создание различных сущностей.')
        .helpful()
        .cmd().name('level').apply(require('./create/level').OptParse).end()
        .cmd().name('block').apply(require('./create/block').OptParse).end()
        //.cmd().name('elem').apply(require('./create/elem').OptParse).end()
        //.cmd().name('mod').apply(require('./create/mod').OptParse).end();
};
