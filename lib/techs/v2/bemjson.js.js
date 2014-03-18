'use strict';

exports.API_VER = 2;

exports.techMixin = {

    getCreateResult: function(path, suffix, vars) {

        if (vars.opts && vars.opts.content) return vars.opts.content;
        
        return '({})';
        
    }

};
