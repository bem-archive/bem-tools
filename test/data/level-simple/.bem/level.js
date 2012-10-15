exports.baseLevelPath = require('../../../..').require.resolve('./levels/simple');

exports.defaultTechs = [];

exports.getTechs = function() {
    return {
        'css': 'css',
        'js': 'js'
    };
};
