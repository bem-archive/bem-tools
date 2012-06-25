var BEM = require('bem'),
    Q = BEM.require('q'),
    VM = require('vm');

exports.getCreateResult = function(path, suffix, vars) {
    var bemhtmlFile = vars.Prefix + '.bemhtml.js',
        bemjsonFile = vars.Prefix + '.bemjson.js';

    return Q.all([
            readBemhtml(bemhtmlFile),
            readBemjson(bemjsonFile)
        ])
        .spread(function(bemhtml, bemjson) {
            return bemhtml.apply(bemjson);
        });
};

exports.storeCreateResult = function(path, suffix, res, force) {
    // always overwrite html files
    return this.__base(path, suffix, res, true);
};

exports.getDependencies = function() {
    return ['bemjson.js', 'bemhtml.js'];
};

function readBemhtml(path) {
    return BEM.util.readFile(path)
        .then(function(c) {
            VM.runInThisContext(c, path);
            return BEMHTML;
        });
}

function readBemjson(path) {
    return BEM.util.readFile(path)
        .then(function(c) {
            return VM.runInThisContext(c, path);
        });
}
