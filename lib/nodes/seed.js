'use strict';

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

/* jshint -W106 */
exports.__defineGetter__(SeedNodeName, function() {
    return registry.getNodeClass(SeedNodeName);
});
/* jshint +W106 */

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

            if (ctx.arch.hasNode(id)) node = ctx.arch.getNode(id);
            else node = new (registry.getNodeClass('Node'))(id);

            ctx.arch.setNode(
                node,
                ctx.arch.getParents(this)
                    .filter(function(p) {
                        var n = ctx.arch.getNode(p);
                        return !(n instanceof TargetNode.TargetNode);
                    }),
                [this.getId()].concat(this.deps));

            this.rootLevel = createLevel(this.root);
            this.items = this.rootLevel.getItemsByIntrospection();

            return Q.step(

                function() {
                    LOGGER.silly("Going to run createLevelsNodes()");
                    return Q.call(_this.createLevelsNodes, _this, node, _this.deps);
                })

                .then(function() {
                    return _this.takeSnapshot('after alterArch SeedNode ' + _this.getId());
                });

        };

    },

    createLevelsNodes: function(parent, children) {

            var _this = this,
                levels = this.getBlocks(this.root);

            return Q.when(levels)
                .then(function(levels) {
                    return levels.map(function(item) {

                        var id = BlockNode.BlockNode.createId({
                                                    root: _this.root,
                                                    level: _this.rootLevel,
                                                    item: item
                                                });

                        if (_this.ctx.arch.hasNode(id)) return id;

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

    getBlocks: function() {
        var uniq = {};
        return Q.when(this.items, function(items) {
            return items.filter(function(item) {

                if (uniq[item.block]) return false;

                uniq[item.block] = true;
                return true;
            });
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
