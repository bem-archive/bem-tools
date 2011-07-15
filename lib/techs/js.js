var myPath = require('bem/lib/path'),
    fs = require('fs'),
    Template = require('bem/lib/template');

exports.techModule = module;

exports.outFile = function (relFile, file) {
    return '' +
        '/** include("' + relFile + '"); **/\n\n' +
        fs.readFileSync(file) +
        '\n\n';
};
