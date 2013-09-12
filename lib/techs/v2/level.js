'use strict';

var BEM = require('../../..');

exports.API_VER = 2;

exports.techMixin = {

    createByDecl: function(item, level, opts) {

        return this.createLevel({
                outputDir: level.dir,
                force: opts.force
            }, [this.getPath(level.getRelByObj(item))]);

    },

    createLevel: function(opts, names) {
        return BEM.api.create.level(opts, { names: names });
    }

};
