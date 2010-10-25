var level = require('../../level2/.bem/level.js');
for (var n in level) exports[n] = level[n];
exports.techs = exports.techs || {};
exports.techs['css'] = '../../../lib/techs/css.js';
exports.techs['css1'] = '';
delete exports.techs['js'];
delete exports.techs['js1'];