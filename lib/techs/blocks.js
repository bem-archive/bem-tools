var U = require('../util'),
    PATH = require('path');

exports.baseTechPath = require.resolve('./level.js');

exports.techMixin = {

    createLevel: function(opts, names) {

        opts.level = PATH.resolve(U.findLevel(opts.outputDir, 'project'), '.bem/levels/blocks.js');
        return this.__base(opts, names);

    }

};
