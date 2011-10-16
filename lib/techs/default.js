var INHERIT = require('inherit'),
    Tech = require('../tech').Tech;

exports.Tech = INHERIT(Tech, {

    techModule: module,

    getTechPath: function() {
        return 'bem/lib/techs/default';
    }

});
