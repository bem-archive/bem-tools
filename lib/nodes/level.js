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

        return ctx.arch.withLock(this.alterArch(ctx), this);

    },

    alterArch: function(ctx) {

        return function() {

            // create real node for level
            var arch = ctx.arch,
                thisNode = this.getId(),
                levelNode = arch.setNode(new FileNode(this.path), arch.parents[thisNode]),

                // scan level for items
                decl = this.level.getDeclByIntrospection();

            // generate targets for items
            var _this = this;

            decl.forEach(function(block) {
                var itemNode = arch.setNode(new (registry.getNodeClass(_this.itemNodeClassName))(_this.level, block.name), levelNode, thisNode);

                // generate targets for elems
                if (block.elems) block.elems.forEach(function(elem) {
                    arch.setNode(new (registry.getNodeClass(_this.itemNodeClassName))(_this.level, block.name, elem.name), itemNode, thisNode);
                });
            });

        }

    },

    isValid: function(ctx) {
        console.log('ACTUAL STATE:', this.getActualState(ctx));
    },

    getActualState: function(ctx) {
        var decl = this.level.getDeclByIntrospection(),
            levelNodeId = this.path,
            children = ctx.arch.children[levelNodeId],
            _this = this,
            toRemoveBlocks = [],
            toAddBlocks = [],
            toRemoveElems = [],
            toAddElems = [],
            blockId, elemId,
            declBlockIds = {},
            createId;

        decl.forEach(function(block) {
            if (createId = registry.getNodeClass(_this.itemNodeClassName).createId) {
                blockId = createId(_this.level, block.name);
                declBlockIds[blockId] = 1;

                if (!ctx.arch.hasNode(blockId)) {
                    toAddBlocks.push({ block: block, blockId: blockId });
                } else {
                    var blockNodeChildren = ctx.arch.children[blockId] || [],
                        declElemIds = {};

                    if (block.elems) {
                        block.elems.forEach(function(elem) {
                            elemId = createId(_this.level, block.name, elem.name);
                            declElemIds[elemId] = 1;

                            if (blockNodeChildren.indexOf(elemId) === -1) {
                                toAddElems.push({ blockId: blockId, elem: elem });
                            }
                        });

                        blockNodeChildren.forEach(function(elemNodeId) {
                            if (!declElemIds[elemNodeId]) {
                                toRemoveElems.push({ blockId: blockId, elemId: elemNodeId });
                            }
                        });
                    }
                }
            }
        });

        children && children.forEach(function(blockNodeId) {
            if (!declBlockIds[blockNodeId]) {
                toRemoveBlocks.push(blockNodeId);
            }
        });

        return {
            isActual: !toAddBlocks.length && !toRemoveBlocks.length && !toAddElems.length && !toRemoveElems.length,
            nodeClassName: 'LevelNode',
            id: this.getId(),
            addBlocks: toAddBlocks,
            removeBlocks: toRemoveBlocks,
            addElems: toAddElems,
            removeElems: toRemoveElems
        };
    }
});


exports.BundlesLevelNode = INHERIT(LevelNode, {

    itemNodeClassName: 'BundleNode'

});
