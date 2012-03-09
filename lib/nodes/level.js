var INHERIT = require('inherit'),
    PATH = require('path'),
    createLevel = require('../level').createLevel,

    MagicNode = require('./magic').MagicNode,
    FileNode = require('./file').FileNode,
    BundleNode = require('./bundle').BundleNode;

var LevelNode = exports.LevelNode = INHERIT(MagicNode, {

    __constructor: function(level) {
        this.level = typeof level == 'string'? createLevel(level) : level;
        this.__base(PATH.basename(this.level.dir));
    }

});

exports.BundlesLevelNode = INHERIT(LevelNode, {

    make: function(ctx) {
        if (ctx.arch.hasNode(this.path)) return;

        ctx.arch.withLock(function() {

            // create real node for pages level
            var parents = ctx.arch.parents[this.getId()],
                pageLevelNode = ctx.arch.setNode(new FileNode(this.path), parents),

                // scan level for pages
                decl = this.level.getDeclByIntrospection();

            // generate targets for pages
            var _this = this;
            decl.forEach(function(block) {
                var pageNode = ctx.arch.setNode(new BundleNode(_this.level, block.name), pageLevelNode);

                // generate targets for subpages
                if (block.elems) block.elems.forEach(function(elem) {
                    ctx.arch.setNode(new BundleNode(_this.level, block.name, elem.name), pageNode);
                });
            });

        }, this);
    }

});

