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
            this.getTechs().map(function(tech) {
                var techNode = this.createNode(ctx, tech, bundleNode, this);
                if (techNode) {
                    techTargets[tech] = techNode.getId();
                    this.createOptimizerNode(ctx, tech, bundleNode, techNode);
                }
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
        var f = 'create-' + tech + '-node';

        LOGGER.fdebug('using %s() to create node for tech %s', this[f]?f:'createDefaultNode', tech);

        return (this[f] ||
            this.createDefaultNode).call(this, ctx, tech, bundleNode, magicNode);
    },

    createOptimizerNode: function(ctx, tech, bundleNode, sourceNode) {
        var f = 'create-' + tech + '-optimizer-node';

        LOGGER.fdebug('using %s() to create optimizer node for tech %s', this[f]?f:'createDefaultOptimizerNode', tech);

        return (this[f] ||
            this.createDefaultOptimizerNode).call(this, ctx, tech, sourceNode, bundleNode);
    },

    linkNodes: function(ctx, techTargets) {
        return Q.all(Object.keys(techTargets).map(function(target) {
            var targetNode = ctx.arch.nodes[techTargets[target]];
            if (targetNode.getCreateDependencies)
                return Q.when(targetNode.getCreateDependencies(ctx), function(deps) {
                    for(var d = 0; d < deps.length; d++) ctx.arch.hasNode(deps[d]) && ctx.arch.link(
                        deps[d],
                        techTargets[target]);
                });
        }));
    },

    getBundlePath: function(tech) {
        return this.level.getPath(this.getNodePrefix(), tech);
    },

    getTechs: function() {
        return [
            'bemjson.js',
            'bemdecl.js',
            'deps.js',
            'bemhtml.js',
            'css',
            'ie.css',
            'js',
            'html'
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

    useFileOrBuild: function(node, ctx) {
        var deps = node.getCreateDependencies(ctx);

        for(var i = 0; i < deps.length; i++) {
            var d = deps[i];

            if (!ctx.arch.hasNode(d)) {
                LOGGER.fverbose('dependency %s is required to build %s but does not exist, checking if target already built', d, node.getId());

                if (!PATH.existsSync(PATH.resolve(ctx.root, node.getId()))) {
                    LOGGER.fwarn('%s will not be built because dependency file %s does not exist', node.getId(), d);
                    return null;
                }

                return new FileNode(node.getId());
            }
        }

        return node;
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
                this.level,
                this.getLevels(PATH.resolve(ctx.root, this.getNodePrefix())),
                this.getBundlePath(declTech),
                techPath,
                techName,
                this.getNodePrefix(),
                forked);

        arch.setNode(buildNode);

        bundleNode && arch.addParents(buildNode, bundleNode);
        magicNode && arch.addChildren(buildNode, magicNode);

        arch.setNode(buildNode.getMetaNode(),
            buildNode,
            this.getBundlePath(declTech));

        return buildNode;
    },

    createDefaultNode: function(ctx, tech, bundleNode, magicNode) {
        var arch = ctx.arch,
            filePath = this.getBundlePath(tech);

        if (!PATH.existsSync(PATH.resolve(ctx.root, filePath))) return;

        var node = new FileNode(filePath);

        arch.setNode(node);

        bundleNode && arch.link(node, bundleNode);
        magicNode && arch.link(magicNode, node);

        return node;
    },

    'create-bemdecl.js-node': function(ctx, tech, bundleNode, magicNode) {
        var arch = ctx.arch,
            node = this.useFileOrBuild(
                new BemCreateNode(this.level, this.item, tech, tech),
                ctx);

        if (!node) return;

        arch.setNode(node);

        bundleNode && arch.link(node, bundleNode);
        magicNode && arch.link(magicNode, node);

        return node;
    },

    'create-deps.js-node': function(ctx, tech, bundleNode, magicNode) {
        var techPath = this.level.resolveTech(tech);
        return this.setBemBuildNode(ctx, tech, techPath, 'bemdecl.js', bundleNode, magicNode);
    },

    'create-html-node': function(ctx, tech, bundleNode, magicNode) {
        // TODO: move node to bem-bl/blocks-common/i-bem/bem
        var arch = ctx.arch,
            node = this.useFileOrBuild(
                new BemCreateNode(
                    this.level,
                    this.item,
                    this.level.resolveTech(tech),
                    tech,
                    true),
                ctx);

        if (!node) return;

        arch.setNode(node);

        bundleNode && arch.link(node, bundleNode);
        magicNode && arch.link(magicNode, node);

        return node;

    },

    'create-bemhtml.js-node': function(ctx, tech, bundleNode, magicNode) {
        // TODO: move node to bem-bl/blocks-common/i-bem/bem
        var techPath = this.level.resolveTech(tech);
        LOGGER.fdebug('techpath for tech %s is %s', tech, techPath);
        return this.setBemBuildNode(ctx, tech, techPath, 'deps.js', bundleNode, magicNode, true);
    },

    'create-js-node': function(ctx, tech, bundleNode, magicNode) {
        var techPath = this.level.resolveTech(tech);
        return this.setBemBuildNode(ctx, tech, techPath, 'deps.js', bundleNode, magicNode);
    },

    'create-css-node': function(ctx, tech, bundleNode, magicNode) {
        var techPath = this.level.resolveTech(tech);
        return this.setBemBuildNode(ctx, tech, techPath, 'deps.js', bundleNode, magicNode);
    },

    'create-ie.css-node': function(ctx, tech, bundleNode, magicNode) {
        return this['create-css-node'].apply(this, arguments);
    },

    createDefaultOptimizerNode: function(ctx, tech, sourceNode, bundleNode) {
    },

    'create-js-optimizer-node': function(ctx, tech, sourceNode, bundleNode) {
        var arch = ctx.arch,
            node = new (registry.getNodeClass('BorschikNode'))(sourceNode, 'js', true);

        arch.setNode(node);

        arch.link(sourceNode, node);
        arch.link(node, bundleNode);

        return node;
    },

    'create-css-optimizer-node': function(ctx, tech, sourceNode, bundleNode) {
        LOGGER.fdebug('creating borschik node for %s', sourceNode.getId());

        var arch = ctx.arch,
            node = new (registry.getNodeClass('BorschikNode'))(sourceNode, 'css-fast', true);

        arch.setNode(node);

        arch.link(sourceNode, node);
        arch.link(node, bundleNode);

        return node;
    },

    'create-ie.css-optimizer-node': function(ctx, tech, sourceNode, bundleNode) {
        var node = this['create-css-optimizer-node'](ctx, tech, sourceNode, bundleNode);

        ctx.arch.addChildren(node, this.getBundlePath('css'));

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
