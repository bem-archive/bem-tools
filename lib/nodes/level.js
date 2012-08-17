var INHERIT = require('inherit'),
    Q = require('q'),
    PATH = require('path'),
    U = require('../util'),
    createLevel = require('../level').createLevel,
    LOGGER = require('../logger'),

    FileNode = require('./file'),
    MagicNode = require('./magic').MagicNodeName,
    Bundle = require('./bundle'),
    BlockNode = require('./block'),

    registry = require('../nodesregistry'),

    LevelNodeName = exports.LevelNodeName = 'LevelNode';

exports.__defineGetter__(LevelNodeName, function() {
    return registry.getNodeClass(LevelNodeName);
});

registry.decl(LevelNodeName, MagicNode, {

    nodeType: 3,

    __constructor: function(o) {

        this.level = typeof o.level == 'string'?
            createLevel(PATH.resolve(o.root, o.level)) :
            o.level;
        this.lastTimeDecl = [];

        this.__base(U.extend({ path: this.__self.createPath(o) }, o));

    },

    itemNodeClassName: BlockNode.BlockNodeName,

    make: function() {

        return this.ctx.arch.withLock(this.alterArch(), this);

    },

    alterArch: function() {

        var ctx = this.ctx;

        return function() {

            // create real node for level
            var arch = ctx.arch,
                levelNode,

                snapshot1 = this.takeSnapshot('before LevelNode alterArch'),

                // scan level for items
                decl = this.scanLevelItems();

            if (arch.hasNode(this.path)) {
                levelNode = arch.getNode(this.path);
            } else {
                levelNode = new FileNode.FileNode({
                    root: this.root,
                    path: this.path
                });
                arch.setNode(levelNode, arch.getParents(this));
            }

            var itemNodeClass = registry.getNodeClass(this.itemNodeClassName),
                declIds = {};

            // collect level items into a hash to speedup further checks
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

            return Q.all([snapshot1, this.takeSnapshot('after LevelNode alterArch ' + this.getId())]);
        }

    },

    scanLevelItems: function() {
        return this.level.getDeclByIntrospection();
    },

    actualizeElements: function(newBlockDecl, oldBlockDecl, node) {

    },

    /**
     * returns the path of the level relative to project root
     * @return {String}
     */
    getLevelPath: function() {
        return PATH.relative(this.root, this.level.dir);
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


var BundlesLevelNodeName = exports.BundlesLevelNodeName = 'BundlesLevelNode';

exports.__defineGetter__(BundlesLevelNodeName, function() {
    return registry.getNodeClass(BundlesLevelNodeName);
});

registry.decl(BundlesLevelNodeName, LevelNodeName, {

    itemNodeClassName: Bundle.BundleNodeName,

    mergedBundleName: function() {
        return 'merged'
    },

    buildMergedBundle: function() {
        return false;
    },

    /**
     * Overriden. After execution of the base method adds a MergedBundle node in the case it's enabled.
     */
    alterArch: function() {
        var base = this.__base(),
            _this = this;

        return function() {
            base.apply(this);

            var arch = this.ctx.arch;

            if (this.buildMergedBundle() && this.mergedBundleName() &&
                !arch.hasNode(Bundle.MergedBundleNode.createId({

                    root: this.root,
                    level: this.level,
                    item: {block: this.mergedBundleName()}}))) {

                var levelNode = arch.getNode(this.path),
                    bundles = arch.getChildren(levelNode)
                    .filter(function(b) {
                        return arch.getNode(b) instanceof Bundle.BundleNode;
                    }, this);

                arch.setNode(new Bundle.MergedBundleNode({
                    root: this.root,
                    level: this.level,
                    item: {block: this.mergedBundleName()}}), arch.getNode(this.path).getId(), bundles);

                return this.takeSnapshot('after BundlesLevelNode alterArch ' + this.getId());
            }
        }
    },

    /**
     * Overriden. Filters out merged bundle name (takes place when merged bundle name directory exists on the file system).
     * @return {*}
     */
    scanLevelItems: function() {
        return this.__base().filter(function(i) {
            return i.name !== this.mergedBundleName();
        }, this);
    },

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
