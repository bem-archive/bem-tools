'use strict';

exports.baseLevelPath = require.resolve('./simple');

exports.getTypes = function() {
    return ['project'].concat(this.__base());
};

exports.getTechs = function() {

    return {
        'blocks': 'level-proto',
        'bundles': 'level-proto',
        'docs': 'level-proto'
    };

};
