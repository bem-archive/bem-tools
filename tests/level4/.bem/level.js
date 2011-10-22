exports.baseLevelPath = require.resolve('bem/lib/levels/simple');
exports.getTechs = function() {
    var techs;
    techs = {
        'css': 'bem/lib/techs/css',
        'js': 'bem/lib/techs/js'
    };
    techs = techs || this.__base();
    techs['xsl'] = '';
    return techs;
};