var SYS = require('sys'),
    INHERIT = require('inherit'),
    Tech = require('../tech').Tech,
    bemUtil = require('../util');

exports.Tech = INHERIT(Tech, {

    getCreateResult: function(path, suffix, vars) {
        return 'module.exports = ' +
            JSON.stringify(this.getContext().getLevel().getBlockByIntrospection(vars.BlockName), null, 4) + ';\n';
    },

    readContent: function(path, suffix) {
        if(bemUtil.isFile(path)) {
            return require(path);
        }

        //SYS.error('Нет файла ' + path);
        return {};
    },

    // .decl.js не собираются при вызове bem build
    build: function() {}

});
