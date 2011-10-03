module.exports = function() {

    return this
        .title('Работа с декларациями использования.')
        .helpful()
        .cmd().name('merge').apply(require('./decl/merge')).end()
        .cmd().name('subtract').apply(require('./decl/subtract')).end();

};
