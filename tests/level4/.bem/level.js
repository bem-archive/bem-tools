var level = require('bem/levels/simple');
for (var n in level) exports[n] = level[n];
exports.techs = {
    'css': '../../../lib/techs/css.js',
    'js': ''
};
exports.techs = exports.techs || {};
exports.techs['xsl'] = '';