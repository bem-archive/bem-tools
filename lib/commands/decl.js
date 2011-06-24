exports.OptParse = function() {
    return this
        .title('Работа с декларациями использования.')
        .helpful()
        .cmd().name('merge').apply(require('./decl/merge').OptParse).end()
        .cmd().name('subtract').apply(require('./decl/subtract').OptParse);
};
