exports.baseLevelPath = require('../../../..').require.resolve('./levels/nested');

exports.defaultTechs = [];

exports.getTechs = function() {
    return {
        'css': 'css',
        'js': 'js'
    };
};
