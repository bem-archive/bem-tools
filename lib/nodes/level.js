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
                thisNode = this.getId(),
                levelNode = arch.hasNode(this.path)?
                    arch.getNode(this.path).getId() :
                    arch.setNode(new FileNode(this.path), arch.parents[thisNode]),

                // scan level for items
                decl = this.level.getDeclByIntrospection();

            // generate targets for items
            var _this = this,
                itemNodeClass = registry.getNodeClass(_this.itemNodeClassName),
                declIds = {},
                nodesToRemove = [];

            // collect level items into a hash
            decl.map(function(d) {
                declIds[itemNodeClass.createId(_this.level, d.name)] = true;
            });

            var lastTimeDeclHash = {};
            this.lastTimeDecl.forEach(function(d){
                var id = itemNodeClass.createId(_this.level, d.name);
                if (!declIds[id]) nodesToRemove.push(id);
                lastTimeDeclHash[d.name] = d;
            });

            nodesToRemove.forEach(function(n){
                arch.getNode(n).cleanup(ctx);
                arch.removeTree(n);
            });


            decl.forEach(function(block) {
                var itemNodeId = itemNodeClass.createId && itemNodeClass.createId(_this.level, block.name);

                if (itemNodeId && arch.hasNode(itemNodeId)) {
                    arch.getNode(itemNodeId).getId();
                } else {
                    arch.setNode(new itemNodeClass(_this.level, block.name), levelNode, thisNode);
                }

                _this.actualizeElements(
                    ctx,
                    block,
                    lastTimeDeclHash[block.name],
                    levelNode);

            });

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
        var _this = this,
            arch = ctx.arch,
            declIds = {},
            itemNodeClass = registry.getNodeClass(this.itemNodeClassName);

        if (newBlockDecl.elems) {
            newBlockDecl.elems.map(function(d) {
                var id = itemNodeClass.createId(_this.level, newBlockDecl.name, d.name);
                declIds[id] = true;
            });
        }

        var lastTimeDeclHash = {},
            nodesToRemove = [];

        if (oldBlockDecl && oldBlockDecl.elems) {
            oldBlockDecl.elems.forEach(function(d){
                var id = itemNodeClass.createId(_this.level, newBlockDecl.name, d.name);
                if (!declIds[id]) nodesToRemove.push(id);
                lastTimeDeclHash[d.name] = d;
            });



            nodesToRemove.forEach(function(n){
                arch.getNode(n).cleanup(ctx);
                arch.removeTree(n);
            });


        }

        if (newBlockDecl.elems) {
            newBlockDecl.elems.forEach(function(elem) {
                var itemNodeId = itemNodeClass.createId && itemNodeClass.createId(_this.level, newBlockDecl.name, elem.name);

                if (itemNodeId && arch.hasNode(itemNodeId)) {
                    arch.getNode(itemNodeId).getId();
                } else {
                    arch.setNode(new itemNodeClass(_this.level, newBlockDecl.name, elem.name), node, _this.getId());
                }
            });
        }
    }
});
