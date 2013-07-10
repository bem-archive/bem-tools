'use strict';

module.exports = function() {

    return this
        .title('Usage declaration manipulation tool.')
        .helpful()
        .cmd().name('merge').apply(require('./decl/merge')).end()
        .cmd().name('intersect').apply(require('./decl/intersect')).end()
        .cmd().name('subtract').apply(require('./decl/subtract')).end();

};
