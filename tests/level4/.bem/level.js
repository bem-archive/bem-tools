exports.baseLevelPath = require.resolve('bem/lib/levels/simple');
exports.getTechs = function() {
    var techs;
    techs = {
        'css': 'bem/lib/techs/css.js',
        'js': 'bem/lib/techs/js.js'
    };
    techs = techs || this.__base();
    techs['xsl'] = '';
    return techs;
};
