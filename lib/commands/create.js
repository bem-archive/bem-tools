module.exports = function() {
    return this
        .title('Создание различных сущностей.')
        .helpful()
        .cmd().name('level').apply(require('./create/level').COA).end()
        .cmd().name('block').apply(require('./create/block').COA).end()
        .cmd().name('elem').apply(require('./create/elem').COA).end()
        .cmd().name('mod').apply(require('./create/mod').COA).end();
};
