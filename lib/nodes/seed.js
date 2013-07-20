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
    BlockNode = require('./block'),
    TargetNode = require('./target'),

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
                ctx.arch.setNode(
                    node,
                    ctx.arch.getParents(this)
                        .filter(function(p) {
                            var node = ctx.arch.getNode(p);
                            return !(node instanceof TargetNode.TargetNode);
                        }),
                    [this.getId()].concat(this.deps));
            }

            this.rootLevel = createLevel(this.root);
            this.items = this.rootLevel.getItemsByIntrospection()

            return Q.step(

//                function() {
//                    LOGGER.silly("Going to run createBlocksLevelsNodes()");
//                    return Q.call(_this.createBlocksLevelsNodes, _this, node, _this.deps);
//                },
//
//                function(blocks) {
//                    LOGGER.silly("Going to run createBundlesLevelsNodes()");
//                    return [
//                        blocks,
//                        Q.call(_this.createBundlesLevelsNodes, _this, node, _this.deps)
//                    ];
//                },
//
//                function(blocks, bundles) {
//                    return Q.call(_this.removeRudiments, _this, node,
//                        (blocks || []).concat(bundles, _this.deps, _this.getId()));
//                })

                function() {
                    LOGGER.silly("Going to run createLevelsNodes()");
                    return Q.call(_this.createLevelsNodes, _this, node, _this.deps);
                })

                .then(function() {
                    return _this.takeSnapshot('after alterArch SeedNode ' + _this.getId());
                });

        }

    },

    createBlocksLevelsNodes: function(parent, children) {
        return [];


        return this.createLevelsNodes(
            this.getBlocksLevels(this.root),
            levelNodes.LevelNode,
            parent,
            children);

    },

    createBundlesLevelsNodes: function(parent, children) {

        return this.createLevelsNodes(
            this.getBlocks(this.root),
            BlockNode.BlockNode,
            parent,
            children);

    },

    createLevelsNodes: function(parent, children) {

            var _this = this,
                levels = this.getBlocks(this.root);


            return Q.when(levels)
                .then(function(levels) {

                    return levels.map(function(item) {
                        var node = new BlockNode.BlockNode({
                            root: _this.root,
                            level: _this.rootLevel,
                            item: item
                        });

                        _this.ctx.arch.setNode(node, parent, children);

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

    getBlocks: function() {
        var uniq = {};
        return Q.when(this.items, function(items) {
            return items.filter(function(item) {

                if (uniq[item.block]) return false;

                uniq[item.block] = true;
                return true;
            })
        })
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
