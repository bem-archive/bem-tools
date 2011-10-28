var level = require('bem/lib/levels/simple');
for (var n in level) exports[n] = level[n];
exports.techs = {
    'css': 'bem/lib/techs/css',
    'js': 'node_modules/bem/lib/techs/js'
};
exports.techs = exports.techs || {};
exports.techs['xsl'] = '';