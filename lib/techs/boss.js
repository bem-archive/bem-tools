var INHERIT = require('inherit'),
    Template = require('../template'),
    Tech = require('../tech').Tech;

exports.Tech = INHERIT(Tech, {

    getBuildResultChunk: function(relPath, path, suffix) {
        return '@import "' + relPath + '";\n';
    },

    getCreateResult: function(path, suffix, vars) {
      
        var template = ['{{bemBlockName}} {'],
            level = '    ',
            indent = '';
          
        if (vars.ElemName) {
            indent += level;
            vars.ElemSelector = '&' + vars.ElemName;
            template.push(indent + '{{bemElemSelector}} {');
        }
      
        if (vars.ModVal) {
            indent += level;
            vars.ModSelector = '&:' + vars.ModName + '(' + vars.ModVal + ')';
            template.push(indent + '{{bemModSelector}} {');
        }
      
        template.push(indent += level)
      
        while (indent.length) {
            indent = indent.slice(level.length);
            template.push(indent + '}');
        }
      
        return Template.process(template, vars);

    }

});
