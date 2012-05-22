var FS = require('fs'),
    VM = require('vm');

exports.getCreateResult = function(path, suffix, vars) {
    var bemhtmlFile = vars.Prefix + '.bemhtml.js',
        bemjsonFile = vars.Prefix + '.bemjson.js';

    VM.runInThisContext(FS.readFileSync(bemhtmlFile, 'utf-8'));
    return BEMHTML.apply(VM.runInThisContext(FS.readFileSync(bemjsonFile, 'utf-8')));
};

exports.getDependencies = function() {
    return ['bemjson.js', 'bemhtml.js'];
};

exports.getDependencies = function() {
    return ['bemjson.js', 'bemhtml.js'];
};
