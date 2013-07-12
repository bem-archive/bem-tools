var Q = require('qq'),
    INHERIT = require('inherit'),
    UTIL = require('util'),
    PATH = require('../path'),
    U = require('../util'),
    LOGGER = require('../logger'),
    registry = require('../nodesregistry'),
    createLevel = require('../index').createLevel,

    node = require('./node'),
    MagicNode = require('./magic').MagicNodeName,
    levelNodes = require('./level'),

    SeedNodeName = exports.SeedNodeName = 'SeedNode';

exports.__defineGetter__(SeedNodeName, function() {
    return registry.getNodeClass(SeedNodeName);
});

registry.decl(SeedNodeName, node.NodeName, /** @lends SeedNode.prototype */ {

    __constructor: function(o) {
        this.root = o.root;
        this.deps = o.deps || [];
        this.__base(o);
    },

    bundlesLevelsRegexp: /^(pages.*|bundles.*)/i,
    blocksLevelsRegexp: /^(blocks.*)/i,

    clean: function() {
        return this.make();
    },

    make: function() {
        return this.ctx.arch.withLock(this.alterArch(), this);
    },

    alterArch: function() {

        var ctx = this.ctx;

        return function() {

            var _this = this,
                node,
                id = this.getId();

            id = id.substring(0, id.length - 1);

            if (ctx.arch.hasNode(id))
                node = ctx.arch.getNode(id);
            else {
                node = new (registry.getNodeClass('Node'))(id);
                ctx.arch.setNode(node, ctx.arch.getParents(this), [this.getId()].concat(this.deps));
            }

            this.rootLevel = createLevel(this.root);
            this.items = this.rootLevel.getItemsByIntrospection()

            return Q.step(

                function() {
                    LOGGER.silly("Going to run createBlocksLevelsNodes()");
                    return Q.call(_this.createBlocksLevelsNodes, _this, node, _this.deps);
                },

                function(blocks) {
                    LOGGER.silly("Going to run createBundlesLevelsNodes()");
                    return [
                        blocks,
                        Q.call(_this.createBundlesLevelsNodes, _this, node, _this.deps)
                    ];
                },

                function(blocks, bundles) {
                    return Q.call(_this.removeRudiments, _this, node,
                        (blocks || []).concat(bundles, _this.deps, _this.getId()));
                })

                .then(function() {
                    return _this.takeSnapshot('after alterArch SeedNode ' + _this.getId());
                });

        }

    },

    removeRudiments: function(node, keep) {

        this.ctx.arch.getChildren(node).forEach(function(c) {

            if (!~keep.indexOf(c) && !~keep.indexOf(c+'*')) {

                var n = this.ctx.arch.getNode(c);

                if (n.cleanup) {
                    n.ctx = this.ctx;
                    n.cleanup && n.cleanup();
                    delete n.ctx;
                }

                this.ctx.arch.removeTree(c);

            }

        }, this);

    },

    createBlocksLevelsNodes: function(parent, children) {
        return [];


        return this.createLevelsNodes(
            this.getBlocksLevels(this.root),
            levelNodes.LevelNode,
            parent,
            children);

    },

    _createBundlesLevelsNodes: function(parent, children) {

        var levels =  this.createLevelsNodes(
            this.getBundlesLevels(PATH.resolve(this.root, this.path)),
            levelNodes.BundlesLevelNode,
            parent,
            children);

        return levels.then(function(levels) {
            console.dir(levels);
            return levels;
        })

    },

    createBundlesLevelsNodes: function(parent, children) {

        return this.createLevelsNodes(
            this.getBundlesLevels(this.root),
            levelNodes.BundlesLevelNode,
            parent,
            children);

    },

    createLevelsNodes: function(levels, nodeClass, parent, children) {

            var _this = this;


            return Q.when(levels)
                .then(function(levels) {

                    return levels.map(function(item) {
                        var node = new nodeClass({
                            root: _this.root,
                            level: _this.rootLevel,
                            item: item
                        });

                        _this.ctx.arch.setNode(node, parent, children);

                        return node.getId();
                    });

                });

        },

    _createLevelsNodes: function(levels, nodeClass, parent, children) {

        var _this = this;

        return Q.when(levels)
            .then(function(levels) {

                return levels.map(function(level) {

                    var o = {
                            root: PATH.resolve(_this.root),
                            level: PATH.join(_this.path, level)
                        },

                        id = nodeClass.createId(o),
                        node;

                    if (_this.ctx.arch.hasNode(id)) {
                        node = _this.ctx.arch.getNode(id);
                        _this.ctx.arch.getChildren(node).forEach(function(c) {
                            _this.ctx.arch.unlink(id, c);
                        });
                    } else {
                        node = new nodeClass(o);
                        _this.ctx.arch.setNode(node, parent);
                    }

                    _this.ctx.arch.addChildren(node, children);

                    return node.getId();

                });

            });

    },

    getBlocksLevels: function(from) {
        return Q.when(this.items, function(items) {
            return items.filter(function(item) {
                return item.tech === 'blocks';
            })
        })
    },

    getBundlesLevels: function(from) {
        return Q.when(this.items, function(items) {
            return items.filter(function(item) {
                return item.tech === 'bundles';
            })
        })
    },

    getLevels: function(from, mask) {

        return U.getDirsAsync(from)
            .invoke('filter', function(dir) {
                return dir.match(mask);
            });

    }

}, /** @lends SeedNode */ {

    /**
     * Create node id.
     *
     * @param {Object} o  Node options.
     * @return {String}   Node id.
     */
    createId: function(o) {
        return (o.name || o.path || 'seed') + '*';
    }

});
