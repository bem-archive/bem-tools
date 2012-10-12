'use strict';

var Q = require('q'),
    PATH = require('../path'),
    U = require('../util'),
    createLevel = require('../level').createLevel,

    registry = require('../nodesregistry'),
    MagicNode = require('./magic').MagicNodeName,
    fileNodes = require('./file'),

    BlockNodeName = exports.BlockNodeName = 'BlockNode';

/* jshint -W106 */
exports.__defineGetter__(BlockNodeName, function() {
    return registry.getNodeClass(BlockNodeName);
});
/* jshint +W106 */

registry.decl(BlockNodeName, MagicNode, {

    nodeType: 9,

    __constructor: function(o) {

        this.level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level), {
                projectRoot: o.root
            }) :
            o.level;
        this.item = o.item || o;

        this.__base(U.extend({ path: this.__self.createPath(o) }, o));

    },

    make: function() {

        return this.ctx.arch.withLock(this.alterArch(), this);

    },

    alterArch: function() {

        var ctx = this.ctx;

        return function() {

            // create real node for block
            var arch = ctx.arch,
                blockNode;

            if (arch.hasNode(this.path)) {
                blockNode = arch.getNode(this.path);
            } else {
                blockNode = new fileNodes.FileNode({
                    root: this.root,
                    path: this.path
                });
                arch.setNode(blockNode, arch.getParents(this));
            }

            // generate targets for page files
            var optTechs = this.getOptimizerTechs();
            this.getTechs().map(function(tech) {
                var techNode = this.createTechNode(tech, blockNode, this);
                if (techNode && ~optTechs.indexOf(tech)) {
                    this.createOptimizerNode(tech, techNode, blockNode);
                }
            }, this);

            return Q.when(this.takeSnapshot('after alterArch BlockNode ' + this.getId()));
        };

    },

    lastModified: function() {
        return Q.resolve(0);
    },

    cleanup: function() {
        var arch = this.ctx.arch;
        if (!arch.hasNode(this.path)) return;
        arch.removeTree(this.path);
    },

    getTechs: function() {
        return [];
    },

    getOptimizerTechs: function() {
        return this.getTechs();
    },

    createTechNode: function(tech, bundleNode, magicNode) {

        var f = 'create-' + tech + '-node';
        f = typeof this[f] === 'function'? f : 'createDefaultTechNode';

        LOGGER.fdebug('Using %s() to create node for tech %s', f, tech);

        return this[f].apply(this, arguments);

    },

    createDefaultTechNode: function(tech, bundleNode, magicNode) {

        return this.setFileNode(
            tech,
            bundleNode,
            magicNode);

    },

    createOptimizerNode: function(tech, sourceNode, bundleNode) {

        var f = 'create-' + tech + '-optimizer-node';
        f = typeof this[f] === 'function'? f : 'createDefaultOptimizerNode';

        LOGGER.fdebug('Using %s() to create optimizer node for tech %s', f, tech);

        return this[f].apply(this, arguments);

    },

    createDefaultOptimizerNode: function(tech, sourceNode, bundleNode) {},

    createBorschikOptimizerNode: function(tech, sourceNode, bundleNode) {

        var files = sourceNode.getFiles? sourceNode.getFiles() : [sourceNode.path];

        LOGGER.fdebug('Creating borschik nodes for %s', files);

        return files.map(function(file) {

            var node = new (registry.getNodeClass('BorschikNode'))({
                root: this.root,
                input: file,
                tech: tech,
                forked: true
            });

            LOGGER.fdebug('input %s, node id %s', file, node.getId());

            this.ctx.arch
                .setNode(node)
                .addParents(node, bundleNode)
                .addChildren(node, sourceNode);

            return node;

        }, this);

    },

    /**
     * Create file node, add it to the arch, add dependencies to it.
     *
     * @param {String} tech
     * @param {String} blockNode
     * @param {String} magicNode
     * @return {Node | undefined}
     */
    setFileNode: function(tech, blockNode, magicNode) {

        var arch = this.ctx.arch,
            filePath = this.getBlockPath(tech);

        if (!PATH.existsSync(PATH.resolve(this.root, filePath))) return;

        var node = new fileNodes.FileNode({
            root: this.root,
            path: filePath
        });

        arch.setNode(node);

        blockNode && arch.addParents(node, blockNode);
        magicNode && arch.addChildren(node, magicNode);

        return node;
    },

    getBlockPath: function(tech) {
        return this.level.getPath(this.getNodePrefix(), tech);
    },

    getNodePrefix: function() {

        if (!this._nodePrefix) {
            this._nodePrefix = this.__self.createNodePrefix({
                root: this.root,
                level: this.level,
                item: this.item
            });
        }
        return this._nodePrefix;

    },

    /**
     * returns the path of the block`s level relative to the project root
     * @return {*}
     */
    getLevelPath: function() {
        return PATH.relative(this.root, this.level.dir);
    }

}, {

    createId: function(o) {
        return this.createPath(o) + '*';
    },

    createPath: function(o) {
        return PATH.dirname(this.createNodePrefix(o));
    },

    createNodePrefix: function(o) {

        var level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level), {
                projectRoot: o.root
            }) :
            o.level;

        return PATH.relative(o.root, level.getByObj(o.item));

    }

});
