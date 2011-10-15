var Template = require('../../../lib/template');

exports.techModule = module;

exports.getTechPath = function() {
    return 'bem/test/data/old-techs/css';
};

exports.outFile = function (file) {
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
