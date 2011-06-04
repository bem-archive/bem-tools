exports.techModule = module;

exports.getTechPath = function() {
    return 'bem/lib/techs/decl.js';
};

var sys = require('sys'),
    bemUtil = require('../util');

// .decl.js не собираются при вызове bem build
exports.bemBuild = function(prefixes, outputDir, outputName) {};

exports.newFileContent = function(vars) {
    return 'module.exports = ' +
        JSON.stringify(this.getContext().getLevel().getBlockByIntrospection(vars.BlockName), null, 4) + ';\n';
};

exports.getFileContent = function(prefix) {
    var file = this.fileByPrefix(prefix);
    if(bemUtil.isFile(file)) {
        return require(file);
    }
    sys.error('Нет файла ' + file);
    return {};
};
