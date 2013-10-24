'use strict';

var Q = require('q'),
    _ = require('lodash/dist/lodash.underscore'),
    PATH = require('../path'),
    U = require('../util'),
    createLevel = require('../level').createLevel,

    FileNode = require('./file'),
    MagicNode = require('./magic').MagicNodeName,
    Bundle = require('./bundle'),
    BlockNode = require('./block'),

    registry = require('../nodesregistry'),

    LevelNodeName = exports.LevelNodeName = 'LevelNode';

/* jshint -W106 */
exports.__defineGetter__(LevelNodeName, function() {
    return registry.getNodeClass(LevelNodeName);
});
/* jshint +W106 */

registry.decl(LevelNodeName, MagicNode, {

    nodeType: 3,

    __constructor: function(o) {

        /* jshint -W106 */
        this.__defineGetter__('level', function() {

            if (typeof this._level === 'string') {
                this._level = createLevel(PATH.resolve(this.root, this._level), {
                    projectRoot: o.root
                });
            }
            return this._level;

        });
        /* jshint +W106 */

        this.lastTimeDecl = [];
        this._level = o.level;
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

            var ItemNodeClass = registry.getNodeClass(this.itemNodeClassName),
                declIds = {};

            // collect level items into a hash to speedup further checks
            decl.map(function(item) {

                var id = ItemNodeClass.createId({
                    root: this.root,
                    level: this.level,
                    item: item
                });

                declIds[id] = true;

            }, this);

            // build a hash from decl array got during previous alterArch call
            // put the nodes which are not present in the decl anymore into an array for futher removal
            var lastTimeDeclHash = {},
                nodesToRemove = [];

            this.lastTimeDecl.forEach(function(item) {

                var id = ItemNodeClass.createId({
                    root: this.root,
                    level: this.level,
                    item: item
                });

                if (!declIds[id]) nodesToRemove.push(id);
                lastTimeDeclHash[item.block] = item;

            }, this);

            // remove collected nodes
            nodesToRemove.forEach(function(n){

                var node = arch.getNode(n);
                node.cleanup && node.cleanup();
                arch.removeTree(n);

            });

            // iterate through decl nodes and create the ones which don't present in the arch yet
            decl.forEach(function(item) {

                var o = {
                    root: this.root,
                    level: this.level,
                    item: item
                };

                if (!arch.hasNode(ItemNodeClass.createId(o))) {
                    arch.setNode(new ItemNodeClass(o), levelNode, this);
                }

                // TODO: link elems and mods to blocks, mods elems to elems, mod vals to mods

            }, this);

            this.lastTimeDecl = decl;

            return Q.all([snapshot1, this.takeSnapshot('after LevelNode alterArch ' + this.getId())]);
        };

    },

    scanLevelItems: function() {
        return _.uniq(
            _.sortBy(
                this.level.getItemsByIntrospection()
                    .filter(function(item) {
                        return U.bemType(item) === 'block';
                    }),
                U.bemKey),
            true,
            U.bemKey);
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
        return typeof o.level === 'string'?
            o.level :
            PATH.relative(o.root, o.level.dir);
    }

});


var BundlesLevelNodeName = exports.BundlesLevelNodeName = 'BundlesLevelNode';

/* jshint -W106 */
exports.__defineGetter__(BundlesLevelNodeName, function() {
    return registry.getNodeClass(BundlesLevelNodeName);
});
/* jshint +W106 */

registry.decl(BundlesLevelNodeName, LevelNodeName, {

    itemNodeClassName: Bundle.BundleNodeName,

    mergedBundleItem: function() {
        return { block: this.mergedBundleName() };
    },

    mergedBundleName: function() {
        return 'merged';
    },

    buildMergedBundle: function() {
        return false;
    },

    /**
     * Return all possible source techs for bundle.
     *
     * @public
     * @return {String[]}
     */
    getBundleSourceTechs: function() {
        return ['bemjson.js', 'bemdecl.js'];
    },

    /**
     * Overriden.
     *
     * After execution of the base method adds a MergedBundle node in the case it's enabled.
     */
    alterArch: function() {

        var base = this.__base();
        return function() {

            var _this = this;
            return Q.when(base.call(this))
                .then(function() {

                    var arch = _this.ctx.arch,
                        o = {
                            root: _this.root,
                            level: _this.level,
                            item: _this.mergedBundleItem()
                        };

                    if (_this.buildMergedBundle() &&
                        _this.mergedBundleName() &&
                        !arch.hasNode(Bundle.MergedBundleNode.createId(o))) {

                        var levelNode = arch.getNode(_this.path),
                            bundles = arch.getChildren(levelNode)
                                .filter(function(b) {
                                        return arch.getNode(b) instanceof Bundle.BundleNode;
                                    }, _this);

                        arch.setNode(new Bundle.MergedBundleNode(o),
                            arch.getNode(_this.path).getId(),
                            bundles);

                        return _this.takeSnapshot('after BundlesLevelNode alterArch ' + _this.getId());
                    }

                });

        };

    },

    /**
     * Overriden.
     *
     * Filters out merged bundle name (takes place when merged
     * bundle name directory exists on the file system).
     *
     * @return {Object[]}
     */
    scanLevelItems: function() {

        var r = _.uniq(
            _.sortBy(
                this.level.getItemsByIntrospection()
                    .filter(function(item) {

                        var type = U.bemType(item);

                        // filter out merged bundle, it will be configured later
                        if (type === 'block' && item.block === this.mergedBundleName()) return false;

                        // build only blocks and elems that have file in source techs
                        return ~['block', 'elem'].indexOf(type) && ~this.getBundleSourceTechs().indexOf(item.tech);

                    }, this),
                U.bemKey),
            true,
            U.bemKey);


        return r;
    }

});
