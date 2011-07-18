var Template = require('../template'),
    fs = require('fs');

exports.techModule = module;

exports.getTechPath = function() {
    return 'bem/lib/techs/css';
};

exports.outFile = function (relFile, file) {
    return '@import url(' + file + ');\n';
};

exports.newFileContent = function (vars) {
    vars.Selector = '.' + vars.BlockName +
        (vars.ElemName? '__' + vars.ElemName : '') +
        (vars.ModVal? '_' + vars.ModName + '_' + vars.ModVal : '');

    return Template.process([
        '{{bemSelector}}',
        '{',
        '    /* ... */',
        '}'],
        vars);
};
