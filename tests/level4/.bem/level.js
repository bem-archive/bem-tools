var level = require('bem/level/simple');
for (var n in level) exports[n] = level[n];
exports.techs = {
    'css': true,
    'js': true
};
exports.techs = exports.techs || {};
exports.techs['xsl'] = true;

