var INHERIT = require('inherit'),
    Template = require('../template'),
    CssTech = require('./css').Tech;

exports.Tech = INHERIT(CssTech, {

    getBuildResultChunk: function(relPath, path, suffix) {
        return '@import "' + relPath + '"\n';
    },

    getCreateResult: function(path, suffix, vars) {

        vars.Selector = '.' + vars.BlockName;

        var templateTech=['{{bemSelector}} {'],
            templateTechSpace = vars.ElemName ? '    '  : '';

            if (vars.ElemName) {
                templateTech.push(' ');
                templateTech.push('    &__' + vars.ElemName + ' {');
            }

            if (vars.ModVal) {
                templateTech.push(' ');
                templateTech.push(templateTechSpace + '    &_' + vars.ModName + '_' + vars.ModVal + ' {');
                vars.ModVal ? templateTech.push(templateTechSpace + '    }') : '';
            }

            vars.ElemName ? templateTech.push('    }') : '';

        templateTech.push('}');

        return Template.process(templateTech,vars);

    }

});