'use strict';

var Q = require('q'),
    PATH = require('../path'),
    U = require('../util'),
    LOGGER = require('../logger'),
    createLevel = require('../level').createLevel,

    registry = require('../nodesregistry'),
    MagicNode = require('./magic').MagicNodeName,
    EntityNode = require('./entity').EntityNodeName,
    fileNodes = require('./file'),
    levelNodes = require('./level'),

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

        this.__base(U.extend({}, o, { path: this.__self.resolve(o) }));

    },

    make: function() {

        return this.ctx.arch.withLock(this.alterArch(), this);

    },

    alterArch: function() {

        var ctx = this.ctx;

        return function() {

            // create real node for block
            var _this = this,
                arch = ctx.arch,
                blockNode,
                grouping = this.getId() + '+';

            if (arch.hasNode(grouping)) {
                blockNode = arch.getNode(grouping);
            } else {
                blockNode = new fileNodes.FileNode({
                    root: this.root,
                    path: this.path,
                    id: grouping
                });
                arch.setNode(blockNode, arch.getParents(this), this);
            }

            return Q.when(this.level.getItemsByIntrospection(),
                function(items) {
                    var optTechs = _this.getOptimizerTechs();

                    items.forEach(function(item) {
                        if (!(item.block === _this.item.block
                            && item.elem === _this.item.elem
                            && item.mod === _this.item.mod
                            && item.val === _this.item.val
                            ) || !item.tech) return;


                        var node = _this.createTechNode(item, blockNode, _this);

                        if (node && ~optTechs.indexOf(item.tech))
                            _this.createOptimizerNode(item.tech, node, blockNode);

                    })

                });
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

    getForkedTechs: function() {
        return [
            'bemhtml'
        ];
    },

    getOptimizerTechs: function() {
        return this.getTechs();
    },

    createTechNode: function(item, parentNode, expandingNode) {

        var f = 'create-' + item.tech + '-node';
        f = typeof this[f] === 'function'? f : 'createDefaultTechNode';

        LOGGER.fdebug('Using %s() to create node for tech %s', f, item.tech);

        return this[f].apply(this, arguments);

    },

    createDefaultTechNode: function(item, parentNode, expandingNode) {

        var arch = this.ctx.arch,
            node = new (registry.getNodeClass(EntityNode))({
                root: this.root,
                level: this.level,
                item: item
            });


        arch.setNode(node);
        parentNode && arch.addParents(node, parentNode);
        expandingNode && arch.addChildren(node, expandingNode);

        return node;
    },

    'create-bundles-node': function(item, parentNode, expandingNode) {
        var bundlesLevel = new levelNodes.BundlesLevelNode({
            root: this.root,
            level: this.level,
            item: item
        });

//        console.log(levelNodes.BundlesLevelNode.createId({
//            root: this.root,
//            level: this.level,
//            item: item
//        }));

        this.ctx.arch.setNode(bundlesLevel, parentNode);

        return bundlesLevel;
    },

    'create-blocks-node': function(item, parentNode, expandingNode) {
        var blocksLevel = new levelNodes.LevelNode({
            root: this.root,
            level: this.level,
            item: item
        });

        this.ctx.arch.setNode(blocksLevel, parentNode);

        return blocksLevel;
    },

    /**
     * Creates borschik node for js tech.
     * @param {String} tech
     * @param {String} sourceNode
     * @param {String} bundleNode
     * @return {Node | undefined}
     */
    'create-js-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this.createBorschikOptimizerNode('js+coffee', sourceNode, bundleNode);
    },

    /**
     * Creates borschik node for priv.js tech.
     * @param {String} tech
     * @param {String} sourceNode
     * @param {String} bundleNode
     * @return {Node | undefined}
     */
    'create-priv.js-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this['create-js-optimizer-node'].apply(this, arguments);
    },

    /**
     * Creates borschik node for bemhtml tech.
     * @param {String} tech
     * @param {String} sourceNode
     * @param {String} bundleNode
     * @return {Node | undefined}
     */
    'create-bemhtml-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this['create-js-optimizer-node'].apply(this, arguments);
    },

    /**
     * Creates borschik node for bemhtml.js tech.
     * @param {String} tech
     * @param {String} sourceNode
     * @param {String} bundleNode
     * @return {Node | undefined}
     */
    'create-bemhtml.js-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this['create-bemhtml-optimizer-node'].apply(this, arguments);
    },

    /**
     * Creates borschik node for css tech.
     * @param {String} tech
     * @param {String} sourceNode
     * @param {String} bundleNode
     * @return {Node | undefined}
     */
    'create-css-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this.createBorschikOptimizerNode('css-fast', sourceNode, bundleNode);
    },

    /**
     * Creates borschik node for ie.css tech.
     * @param {String} tech
     * @param {String} sourceNode
     * @param {String} bundleNode
     * @return {Node | undefined}
     */
    'create-ie.css-optimizer-node': function(tech, sourceNode, bundleNode) {

        var nodes = this['create-css-optimizer-node'].apply(this, arguments);
        this.ctx.arch.link(this.getBundleId('css'), nodes);
        return nodes;

    },

    /**
     * Creates borschik node for ie6.css tech.
     * @param {String} tech
     * @param {String} sourceNode
     * @param {String} bundleNode
     * @return {Node | undefined}
     */
    'create-ie6.css-optimizer-node': function(tech, sourceNode, bundleNode) {

        var nodes = this['create-ie.css-optimizer-node'].apply(this, arguments);
        this.ctx.arch.link(this.getBundleId('ie.css'), nodes);
        return nodes;

    },

    /**
     * Creates borschik node for ie7.css tech.
     * @param {String} tech
     * @param {String} sourceNode
     * @param {String} bundleNode
     * @return {Node | undefined}
     */
    'create-ie7.css-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this['create-ie6.css-optimizer-node'].apply(this, arguments);
    },

    /**
     * Creates borschik node for ie8.css tech.
     * @param {String} tech
     * @param {String} sourceNode
     * @param {String} bundleNode
     * @return {Node | undefined}
     */
    'create-ie8.css-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this['create-ie6.css-optimizer-node'].apply(this, arguments);
    },


    /**
     * Creates borschik node for ie9.css tech.
     * @param {String} tech
     * @param {String} sourceNode
     * @param {String} bundleNode
     * @return {Node | undefined}
     */
    'create-ie9.css-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this['create-ie.css-optimizer-node'].apply(this, arguments);
    },

    createOptimizerNode: function(tech, sourceNode, bundleNode) {

        var f = 'create-' + tech + '-optimizer-node';
        f = typeof this[f] === 'function'? f : 'createDefaultOptimizerNode';

        LOGGER.fdebug('Using %s() to create optimizer node for tech %s', f, tech);

        return this[f].apply(this, arguments);

    },

    createDefaultOptimizerNode: function(tech, sourceNode, bundleNode) {},

    createBorschikOptimizerNode: function(tech, sourceNode, parentNode) {

        var files = sourceNode.getPaths();

        return files.map(function(file) {
            var node = new (registry.getNodeClass('BorschikNode'))({
                root: this.root,
                input: file,
                tech: tech,
                forked: true
            });

            LOGGER.fdebug('borschik input %s, node id %s', file, node.getId());

            this.ctx.arch
                .setNode(node)
                .addParents(node, parentNode)
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

    /**
     * returns the path of the block`s level relative to the project root
     * @return {*}
     */
    getLevelPath: function() {
        return PATH.relative(this.root, this.level.dir);
    }

}, {

    createId: function(o) {
        // block nodes have ids like level.tech:block (suffix is omitted)
        if (!o.item.suffix){
            console.trace();
            console.dir(o.item);
        }
        return this.__base(o).slice(0, -((o.item || o).suffix.length));
    }

});
