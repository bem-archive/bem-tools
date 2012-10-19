exports.baseLevelPath = require.resolve('../../level2/.bem/level.js');
exports.getTechs = function() {
    var techs;
    techs = techs || this.__base();
    techs['css'] = 'bem/lib/techs/css.js';
    techs['css1'] = '';
    delete techs['js'];
    delete techs['js1'];
    return techs;
};
