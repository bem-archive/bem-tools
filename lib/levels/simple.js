var INHERIT = require('inherit'),
    Level = require('../level').Level;

exports.Level = INHERIT(Level, {

    'get-block': function(block) {
        return block;
    },

    'get-block-mod': function(block, mod) {
        return [block, mod].join('_');
    },

    'get-block-mod-val': function(block, mod, val) {
        return [block, mod, val].join('_');
    },

    'get-elem': function(block, elem) {
        return [block, '_' + elem].join('_');
    },

    'get-elem-mod': function(block, elem, mod) {
        return [block, '_' + elem, mod].join('_');
    },

    'get-elem-mod-val': function(block, elem, mod, val) {
        return [block, '_' + elem, mod, val].join('_');
    }

});
