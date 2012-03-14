var INHERIT = require('inherit'),
    PATH = require('path'),
    createLevel = require('../level').createLevel,

    MagicNode = require('./magic').MagicNode,
    FileNode = require('./file').FileNode,
    BundleNode = require('./bundle').BundleNode,
    BlockNode = require('./block').BlockNode,
    registry = require('../make').Registry;

var LevelNode = exports.LevelNode = INHERIT(MagicNode, {

    __constructor: function(level) {
        this.level = typeof level == 'string'? createLevel(level) : level;
        // TODO: path relative to the project root must be passed
        this.__base(PATH.basename(this.level.dir));
    },

    itemNodeClassName: 'BlockNode',

    make: function(ctx) {
        if (ctx.arch.hasNode(this.path)) return;

        ctx.arch.withLock(function() {

            // create real node for level
            var parents = ctx.arch.parents[this.getId()],
                levelNode = ctx.arch.setNode(new FileNode(this.path), parents),

                // scan level for items
                decl = this.level.getDeclByIntrospection();

            // generate targets for items
            var _this = this;
            decl.forEach(function(block) {
                var itemNode = ctx.arch.setNode(new (registry.getNodeClass(_this.itemNodeClassName))(_this.level, block.name), levelNode);

                // generate targets for subitems
                if (block.elems) block.elems.forEach(function(elem) {
                    ctx.arch.setNode(new (registry.getNodeClass(_this.itemNodeClassName))(_this.level, block.name, elem.name), itemNode);
                });
            });

        }, this);
    }
});


var BundlesLevelNode = exports.BundlesLevelNode = INHERIT(LevelNode, {

    itemNodeClassName: 'BundleNode'

});