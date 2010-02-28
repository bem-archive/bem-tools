var level = require('../../level2/.bem/level.js');
for (var n in level) exports[n] = level[n];
exports.techs = exports.techs || {};
exports.techs['css'] = true;
exports.techs['css1'] = true;
delete exports.techs['js'];
delete exports.techs['js1'];
