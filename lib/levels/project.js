exports.baseLevelPath = require.resolve('./simple');

exports.getTypes = function() {
    return ['project'].concat(this.__base());
};

exports.getTechs = function() {

    return {
        'blocks': 'blocks',
        'bundles': 'bundles'
    };

};
