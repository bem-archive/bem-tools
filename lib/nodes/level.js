var INHERIT = require('inherit'),
    PATH = require('path'),
    createLevel = require('../level').createLevel,

    MagicNode = require('./magic').MagicNode,
    FileNode = require('./file').FileNode,
    BundleNode = require('./bundle').BundleNode,
    BlockNode = require('./block').BlockNode,
    registry = require('../make').NodesRegistry;

var LevelNode = exports.LevelNode = INHERIT(MagicNode, {

    __constructor: function(level) {
        this.level = typeof level == 'string'? createLevel(level) : level;
        this.lastTimeDecl = [];
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
                levelNode,

                // scan level for items
                decl = this.level.getDeclByIntrospection();

            if (arch.hasNode(this.path)) {
                levelNode = arch.getNode(this.path);
            } else {
                levelNode = new FileNode(this.path);
                arch.setNode(levelNode, arch.getParents(this));
            }

            var itemNodeClass = registry.getNodeClass(this.itemNodeClassName),
                declIds = {};

            // collect level items into a hash to speedup futher checks
            decl.map(function(d) {
                declIds[itemNodeClass.createId(this.level, d.name)] = true;
            }, this);

            // build a hash from decl array got during previous alterArch call
            // put the nodes which are not present in the decl anymore into an array for futher removal
            var lastTimeDeclHash = {},
                nodesToRemove = [];
            this.lastTimeDecl.forEach(function(d){
                var id = itemNodeClass.createId(this.level, d.name);
                if (!declIds[id]) nodesToRemove.push(id);
                lastTimeDeclHash[d.name] = d;
            }, this);

            // remove collected nodes
            nodesToRemove.forEach(function(n){
                var node = arch.getNode(n);
                node.cleanup && node.cleanup(ctx);
                arch.removeTree(n);
            });

            // iterate through decl nodes and create the ones which don't present in the arch yet
            decl.forEach(function(block) {

                if (!arch.hasNode(itemNodeClass.createId(this.level, block.name))) {

                    arch.setNode(
                        new itemNodeClass(this.level, block.name),
                        levelNode,
                        this);
                }

                // actualize nodes for current block elements
                this.actualizeElements(
                    ctx,
                    block,
                    lastTimeDeclHash[block.name],
                    levelNode);

            }, this);

            this.lastTimeDecl = decl;
        }

    },

    actualizeElements: function(ctx, newBlockDecl, oldBlockDecl, node) {

    },

    cleanup: function(ctx) {
        var arch = ctx.arch;

        if (!arch.hasNode(this.path)) return;

        arch.removeTree(this.path);
    }
});


exports.BundlesLevelNode = INHERIT(LevelNode, {

    itemNodeClassName: 'BundleNode',

    actualizeElements: function(ctx, newBlockDecl, oldBlockDecl, node) {
        var arch = ctx.arch,
            declIds = {},
            itemNodeClass = registry.getNodeClass(this.itemNodeClassName);

        // collect elements decl ids into hash
        if (newBlockDecl.elems) {
            newBlockDecl.elems.map(function(d) {
                var id = itemNodeClass.createId(this.level, newBlockDecl.name, d.name);
                declIds[id] = true;
            }, this);
        }

        var lastTimeDeclHash = {},
            nodesToRemove = [];

        // if previous block elements decl is defined collect the outdated nodes for removal,
        // hash previous block decl
        if (oldBlockDecl && oldBlockDecl.elems) {
            oldBlockDecl.elems.forEach(function(d){
                var id = itemNodeClass.createId(this.level, newBlockDecl.name, d.name);
                if (!declIds[id]) nodesToRemove.push(id);
                lastTimeDeclHash[d.name] = d;
            }, this);

            nodesToRemove.forEach(function(n){
                var node = arch.getNode(n);
                node.cleanup && node.cleanup(ctx);
                arch.removeTree(n);
            });
        }

        // iterate through new block elements decl and create new nodes
        if (newBlockDecl.elems) {
            newBlockDecl.elems.forEach(function(elem) {

                if (!arch.hasNode(itemNodeClass.createId(this.level, newBlockDecl.name, elem.name))) {
                    arch.setNode(
                        new itemNodeClass(this.level, newBlockDecl.name, elem.name),
                        node,
                        this);
                }
            }, this);
        }
    }
});
