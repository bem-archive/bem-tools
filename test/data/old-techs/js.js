var fs = require('fs'),
    myPath = require('../../../lib/path');

exports.techModule = module;

exports.getTechPath = function() {
    return 'bem/test/data/old-techs/js';
};

exports.outFile = function (relFile, file) {

    return [
        '/* ' + relFile + ': begin */ /**/',
        fs.readFileSync(file),
        '/* ' + relFile + ': end */ /**/',
        '\n'].join('\n');

};
