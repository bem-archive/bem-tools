module.exports = function() {

    return this
        .title('Create of entities tool.')
        .helpful()
        .cmd().name('level').apply(require('./create/level')).end()
        .cmd().name('block').apply(require('./create/block')).end()
        .cmd().name('elem').apply(require('./create/elem')).end()
        .cmd().name('mod').apply(require('./create/mod')).end();

};
