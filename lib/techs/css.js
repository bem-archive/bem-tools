var Template = require('../template');

exports.techModule = module;

exports.getTechPath = function() {
    return 'bem/techs/css';
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
