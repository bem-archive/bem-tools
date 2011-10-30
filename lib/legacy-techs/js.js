var fs = require('fs'),
    myPath = require('../path');

exports.techModule = module;

exports.getTechPath = function() {
    return 'bem/lib/legacy-techs/js';
};

exports.outFile = function (relFile, file) {

    return [
        '/* ' + relFile + ': begin */ /**/',
        fs.readFileSync(file),
        '/* ' + relFile + ': end */ /**/',
        '\n'].join('\n');

};
