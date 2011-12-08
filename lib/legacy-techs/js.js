var fs = require('fs'),
    myPath = require('../path');

exports.techModule = module;

exports.outFile = function (relFile, file) {

    return [
        '/* ' + relFile + ': begin */ /**/',
        fs.readFileSync(file),
        '/* ' + relFile + ': end */ /**/',
        '\n'].join('\n');

};
