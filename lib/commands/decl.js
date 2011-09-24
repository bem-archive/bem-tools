exports.COA = function() {
    return this
        .title('Работа с декларациями использования.')
        .helpful()
        .cmd().name('merge').apply(require('./decl/merge').COA).end()
        .cmd().name('subtract').apply(require('./decl/subtract').COA);
};
