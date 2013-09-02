'use strict';

var insight = require('../insight');

module.exports = function() {

    return this
        .title('Usage declaration manipulation tool.')
        .helpful()
        .extendable()
        .cmd()
            .name('merge')
            .apply(insight.trackCommand)
            .apply(require('./decl/merge'))
            .end()
        .cmd()
            .name('intersect')
            .apply(insight.trackCommand)
            .apply(require('./decl/intersect'))
            .end()
        .cmd()
            .name('subtract')
            .apply(insight.trackCommand)
            .apply(require('./decl/subtract'))
            .end();

};
