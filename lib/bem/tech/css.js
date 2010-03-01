var Template = require('../template');

exports.outFile = function (file) {
    return '@import url(' + file + ');\n';
};

exports.newFileContent = function (vars) {
    return Template.process([
        '.{{bemBlockName}}',
        '{',
        '    /* ... */',
        '}'],
        vars);
};
