var Q = require('q'),
    INHERIT = require('inherit'),
    UTIL = require('../util'),
    PATH = require('path'),
    createLevel = require('../index').createLevel,

    MagicNode = require('./magic').MagicNode,
    FileNode = require('./file').FileNode,
    BemCreateNode = require('./create').BemCreateNode,
    BemBuildNode = require('./build').BemBuildNode,
    registry = require('../make').NodesRegistry,
    LOGGER = require('../logger');

var BundleNode = exports.BundleNode = INHERIT(MagicNode, {

    __constructor: function(level, bundleNameOrItem, subBundleName) {
        this.level = typeof level == 'string'? createLevel(level) : level;

        this.item = (typeof bundleNameOrItem === 'string')? createItem(bundleNameOrItem, subBundleName) : bundleNameOrItem;

        this.__base(PATH.dirname(this.getNodePrefix()));
    },

    make: function(ctx) {

        return ctx.arch.withLock(this.alterArch(ctx), this);

    },

    alterArch: function(ctx) {

        return function() {

            // create real node for page
            var arch = ctx.arch,
                bundleNode;

            if (arch.hasNode(this.path)) {
                bundleNode = arch.getNode(this.path);
            } else {
                bundleNode = new FileNode(this.path);
                arch.setNode(bundleNode, arch.getParents(this));
            }

            // generate targets for page files
            var techTargets = {};
            this.getTechDeps().map(function(tech) {
                var techNode = this.createNode(ctx, tech, bundleNode, this);
                techTargets[tech] = techNode.getId();

                this.createOptimizerNode(ctx, bundleNode, techNode, tech);
            }, this);

            // link targets for page files with each other
            // FIXME: rewrite, move linking to create*() methods
            return this.linkNodes(ctx, techTargets);
        };

    },

    lastModified: function() {
        return Q.resolve(0);
    },

    createNode: function(ctx, tech, bundleNode, magicNode) {
        return (this['create-' + tech + '-node'] ||
            this.createDefaultNode).call(this, ctx, tech, bundleNode, magicNode);
    },

    createOptimizerNode: function(ctx, bundleNode, sourceNode, tech) {
        return (this['create-' + tech + '-optimizer-node'] ||
            this.createDefaultOptimizerNode).call(this, ctx, sourceNode, bundleNode, tech);
    },

    linkNodes: function(ctx, techTargets) {
        return Q.all(Object.keys(techTargets).map(function(target) {
            var targetNode = ctx.arch.nodes[techTargets[target]];
            if (targetNode.getCreateDependencies)
                return Q.when(targetNode.getCreateDependencies(ctx), function(deps) {
                    for(var d = 0; d < deps.length; d++) ctx.arch.link(
                        deps[d],
                        techTargets[target]);
                });
        }));
    },

    getPath: function(tech) {
        // TODO: use Tech object to construct paths
        return this.getNodePrefix() + '.' + tech;
    },

    getTechDeps: function() {
        return [
            'bemjson.js',
            'bemdecl.js',
            'deps.js',
            'html',
            'bemhtml.js',
            'css',
            'ie.css',
            'js'
        ];
    },

    cleanup: function(ctx) {
        var arch = ctx.arch;
        if (!arch.hasNode(this.path)) return;
        arch.removeTree(this.path);
    },

    getNodePrefix: function() {
        if (!this._nodePrefix) {
            this._nodePrefix = this.__self._createId(this.level, this.item);
        }
        return this._nodePrefix;
    },

    getLevels: function(prefix) {
        return [].concat(
            this.level.getConfig().bundleBuildLevels,
            [ PATH.join(PATH.dirname(prefix), 'blocks') ]);
    },

    /**
     * Create a bem build node, add it to the arch,
     * then creates a meta node and link it to the build node.
     *
     * @param ctx
     * @param techName
     * @param techPath
     * @param declTech
     * @param {String} bundleNode
     * @param {String} magicNode
     * @param {Boolean} [forked]
     * @return {String} ID of the node that has been created
     */
    setBemBuildNode: function(ctx, techName, techPath, declTech, bundleNode, magicNode, forked) {
        var arch = ctx.arch,
            buildNode = new BemBuildNode(
                this.getLevels(PATH.resolve(ctx.root, this.getNodePrefix())),
                this.getPath(declTech),
                techPath,
                techName,
                this.getNodePrefix(),
                forked);

        arch.setNode(buildNode);

        bundleNode && arch.addParents(buildNode, bundleNode);
        magicNode && arch.addChildren(buildNode, magicNode);

        arch.setNode(buildNode.getMetaNode(),
            buildNode,
            UTIL.getNodeTechPath(this.level, this.item, declTech));

        return buildNode;
    },

    createDefaultNode: function(ctx, tech, bundleNode, magicNode) {
        var arch = ctx.arch,
            node = new FileNode(this.getPath(tech));

        arch.setNode(node);

        bundleNode && arch.link(node, bundleNode);
        magicNode && arch.link(magicNode, node);

        return node;
    },

    'create-bemdecl.js-node': function(ctx, tech, bundleNode, magicNode) {
        var arch = ctx.arch,
            node = new BemCreateNode(this.level, this.item, tech, tech);

        arch.setNode(node);

        bundleNode && arch.link(node, bundleNode);
        magicNode && arch.link(magicNode, node);

        return node;
    },

    'create-deps.js-node': function(ctx, tech, bundleNode, magicNode) {
        return this.setBemBuildNode(ctx, tech, tech, 'bemdecl.js', bundleNode, magicNode);
    },

    'create-html-node': function(ctx, tech, bundleNode, magicNode) {
        // TODO: move node to bem-bl/blocks-common/i-bem/bem
        var arch = ctx.arch,
            node = new BemCreateNode(
                this.level,
                this.item,
                require.resolve(PATH.resolve(this.level.dir, '../bem-bl/blocks-common/i-bem/bem/techs/html')),
                tech,
                true);

        arch.setNode(node);

        bundleNode && arch.link(node, bundleNode);
        magicNode && arch.link(magicNode, node);

        return node;

    },

    'create-bemhtml.js-node': function(ctx, tech, bundleNode, magicNode) {
        // TODO: move node to bem-bl/blocks-common/i-bem/bem
        var techBemHtml = require.resolve(PATH.resolve(this.level.dir, '../bem-bl/blocks-common/i-bem/bem/techs/bemhtml.js'));
        return this.setBemBuildNode(ctx, tech, techBemHtml, 'deps.js', bundleNode, magicNode, true);
    },

    'create-js-node': function(ctx, tech, bundleNode, magicNode) {
        return this.setBemBuildNode(ctx, tech, tech, 'deps.js', bundleNode, magicNode);
    },

    'create-css-node': function(ctx, tech, bundleNode, magicNode) {
        return this['create-js-node'].apply(this, arguments);
    },

    'create-ie.css-node': function(ctx, tech, bundleNode, magicNode) {
        return this['create-css-node'].apply(this, arguments);
    },

    createDefaultOptimizerNode: function(ctx, sourceNode, bundleNode, tech) {},

    'create-js-optimizer-node': function(ctx, sourceNode, bundleNode) {
        var arch = ctx.arch,
            node = new (registry.getNodeClass('BorschikNode'))(sourceNode, 'js', true);

        arch.setNode(node);

        arch.link(sourceNode, node);
        arch.link(node, bundleNode);

        return node;
    },

    'create-css-optimizer-node': function(ctx, sourceNode, bundleNode) {
        var arch = ctx.arch,
            node = new (registry.getNodeClass('BorschikNode'))(sourceNode, 'css-fast', true);

        arch.setNode(node);

        arch.link(sourceNode, node);
        arch.link(node, bundleNode);

        return node;
    },

    'create-ie.css-optimizer-node': function(ctx, sourceNode, bundleNode) {
        var node = this['create-css-optimizer-node'](ctx, sourceNode, bundleNode);

        ctx.arch.link(
            UTIL.getNodeTechPath(this.level, this.item, 'css'),
            node);

        return node;
    }

}, {

    createId: function(level, bundleNameOrItem, subBundleName) {
        return this.__base(PATH.dirname(this._createId(level, bundleNameOrItem, subBundleName)));
    },

    _createId:  function(level, bundleNameOrItem, subBundleName) {
        return UTIL.getNodePrefix(
            (typeof level == 'string')? createLevel(level) : level,
            (typeof bundleNameOrItem === 'string')? createItem(bundleNameOrItem, subBundleName) : bundleNameOrItem);
    }

});

function createItem(bundleName, subBundleName) {
    var item = { block: bundleName };

    if (subBundleName) item.elem = subBundleName;

    return item;
}
