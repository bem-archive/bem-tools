var INHERIT = require('inherit'),
    PATH = require('path'),
    U = require('../util'),
    createLevel = require('../level').createLevel,

    MagicNode = require('./magic').MagicNode,
    FileNode = require('./file').FileNode,
    BundleNode = require('./bundle').BundleNode,
    BlockNode = require('./block').BlockNode,
    registry = require('../make').NodesRegistry;

var LevelNode = exports.LevelNode = INHERIT(MagicNode, {

    __constructor: function(o) {

        this.level = typeof o.level == 'string'?
            createLevel(PATH.resolve(o.root, o.level)) :
            o.level;
        this.lastTimeDecl = [];

        this.__base(U.extend({ path: this.__self.createPath(o) }, o));

    },

    itemNodeClassName: 'BlockNode',

    make: function() {

        return this.ctx.arch.withLock(this.alterArch(), this);

    },

    alterArch: function() {

        var ctx = this.ctx;

        return function() {

            // create real node for level
            var arch = ctx.arch,
                levelNode,

                // scan level for items
                decl = this.level.getDeclByIntrospection();

            if (arch.hasNode(this.path)) {
                levelNode = arch.getNode(this.path);
            } else {
                levelNode = new FileNode({
                    root: this.root,
                    path: this.path
                });
                arch.setNode(levelNode, arch.getParents(this));
            }

            var itemNodeClass = registry.getNodeClass(this.itemNodeClassName),
                declIds = {};

            // collect level items into a hash to speedup futher checks
            decl.map(function(d) {

                var id = itemNodeClass.createId({
                    root: this.root,
                    level: this.level,
                    item: { block: d.name }
                });

                declIds[id] = true;

            }, this);

            // build a hash from decl array got during previous alterArch call
            // put the nodes which are not present in the decl anymore into an array for futher removal
            var lastTimeDeclHash = {},
                nodesToRemove = [];

            this.lastTimeDecl.forEach(function(d) {

                var id = itemNodeClass.createId({
                    root: this.root,
                    level: this.level,
                    item: { block: d.name }
                });

                if (!declIds[id]) nodesToRemove.push(id);
                lastTimeDeclHash[d.name] = d;

            }, this);

            // remove collected nodes
            nodesToRemove.forEach(function(n){

                var node = arch.getNode(n);
                node.cleanup && node.cleanup();
                arch.removeTree(n);

            });

            // iterate through decl nodes and create the ones which don't present in the arch yet
            decl.forEach(function(block) {

                var o = {
                    root: this.root,
                    level: this.level,
                    item: { block: block.name }
                };

                if (!arch.hasNode(itemNodeClass.createId(o))) {
                    arch.setNode(new itemNodeClass(o), levelNode, this);
                }

                // actualize nodes for current block elements
                this.actualizeElements(
                    block,
                    lastTimeDeclHash[block.name],
                    levelNode);

            }, this);

            this.lastTimeDecl = decl;
        }

    },

    actualizeElements: function(newBlockDecl, oldBlockDecl, node) {

    },

    cleanup: function() {

        var arch = this.ctx.arch;
        if (!arch.hasNode(this.path)) return;
        arch.removeTree(this.path);

    }

}, {

    createId: function(o) {
        return this.createPath(o) + '*';
    },

    createPath: function(o) {

        var level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level)) :
            o.level;

        return PATH.relative(o.root, level.dir);

    }

});


exports.BundlesLevelNode = INHERIT(LevelNode, {

    itemNodeClassName: 'BundleNode',

    actualizeElements: function(newBlockDecl, oldBlockDecl, node) {

        var arch = this.ctx.arch,
            declIds = {},
            itemNodeClass = registry.getNodeClass(this.itemNodeClassName);

        // collect elements decl ids into hash
        if (newBlockDecl.elems) {

            newBlockDecl.elems.map(function(elem) {

                var id = itemNodeClass.createId({
                    root: this.root,
                    level: this.level,
                    item: {
                        block: newBlockDecl.name,
                        elem: elem.name
                    }
                });

                declIds[id] = true;

            }, this);

        }

        var lastTimeDeclHash = {},
            nodesToRemove = [];

        // if previous block elements decl is defined collect the outdated nodes for removal,
        // hash previous block decl
        if (oldBlockDecl && oldBlockDecl.elems) {

            oldBlockDecl.elems.forEach(function(elem) {

                var id = itemNodeClass.createId({
                    root: this.root,
                    level: this.level,
                    item: {
                        block: oldBlockDecl.name,
                        elem: elem.name
                    }
                });

                if (!declIds[id]) nodesToRemove.push(id);
                lastTimeDeclHash[elem.name] = elem;

            }, this);

            nodesToRemove.forEach(function(n){
                var node = arch.getNode(n);
                node.cleanup && node.cleanup();
                arch.removeTree(n);
            });

        }

        // iterate through new block elements decl and create new nodes
        if (newBlockDecl.elems) {

            newBlockDecl.elems.forEach(function(elem) {

                var o = {
                    root: this.root,
                    level: this.level,
                    item: {
                        block: newBlockDecl.name,
                        elem: elem.name
                    }
                };

                if (!arch.hasNode(itemNodeClass.createId(o))) {
                    arch.setNode(new itemNodeClass(o), node, this);
                }

            }, this);

        }

    }

});
