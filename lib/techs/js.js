var myPath = require('bem/lib/path'),
    fs = require('fs'),
    Template = require('bem/lib/template');

exports.techModule = module;

exports.outFile = function (relFile, file) {
    return [
        '/* ', relFile, ': begin */ /**/\n',
        fs.readFileSync(file),
        '\n/* ', relFile, ': end */ /**/\n',
        '\n\n'].join('');
};
