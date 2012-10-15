var INHERIT = require('inherit'),
    Tech = require('../tech').Tech,
    Template = require('../template'),
    bemUtil = require('../util');

exports.Tech = INHERIT(Tech, {
	
	getTechName: function() {
		return 'node.js';
	},

    getBuildResultChunk: function(relPath, path, suffix) {
        return '/*borschik:include:' + relPath + '*/;\n';
    },

	storeBuildResult: function(path, suffix, res) {
			myres = "var INHERIT = require('inherit')\n  , BLOCKDATA = require('../../plugins/bemdata.js');\n"
			+"\nvar db = module.parent.exports.db\n"
			+"  , req = module.parent.exports.req\n"
			+"  , res = module.parent.exports.res;\n\n"
			+res
            return bemUtil.writeFile(path, myres);
        },

    getCreateResult: function(path, suffix, vars) {

        vars.Selector = 'exports[\'' + vars.BlockName +
            (vars.ElemName? '__' + vars.ElemName : '') +
            (vars.ModVal? '_' + vars.ModName + '_' + vars.ModVal : '') +
            '\'] = INHERIT( BLOCKDATA, {\n\n},';

        return Template.process([
            '{{bemSelector}}',
            '{',
            '});'],
            vars);

    }
},{
	techname: 'node.js'
});
