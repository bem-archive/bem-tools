var myPath = require('bem/lib/path'),
    fs = require('fs'),
    Template = require('bem/lib/template');

exports.techModule = module;

exports.outFile = function (relFile, file) {

    return [
        '/* ' + relFile + ': begin */ /**/',
        fs.readFileSync(file),
        '/* ' + relFile + ': end */ /**/',
        '\n'].join('\n');

};
