'use strict';

var U = require('../../util'),
    PATH = require('path');

exports.baseTechPath = require.resolve('./level.js');

exports.techMixin = {

    createLevel: function(opts, names) {
        opts.level = this.getLevelProtoPath(U.findLevel(opts.outputDir, 'project'));
        return this.__base(opts, names);
    },

    getLevelProtoName: function() {
        return this.getTechName();
    },

    getLevelProtoPath: function(projectRoot) {
        return PATH.resolve(projectRoot, '.bem/levels/' + this.getLevelProtoName() + '.js');
    }

};
