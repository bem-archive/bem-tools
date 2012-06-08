var Q = require('q'),
    INHERIT = require('inherit'),
    U = require('../util'),
    PATH = require('path'),

    BlockNode = require('./block').BlockNode,
    FileNode = require('./file').FileNode,
    BemCreateNode = require('./create').BemCreateNode,
    BemBuildNode = require('./build').BemBuildNode,
    registry = require('../make').NodesRegistry,
    LOGGER = require('../logger');

var BundleNode = exports.BundleNode = INHERIT(BlockNode, {

    make: function() {

        return this.ctx.arch.withLock(this.alterArch(), this);

    },

    alterArch: function() {

        var ctx = this.ctx;

        return function() {

            // create real node for page
            var arch = ctx.arch,
                bundleNode;

            if (arch.hasNode(this.path)) {
                bundleNode = arch.getNode(this.path);
            } else {
                bundleNode = new FileNode({
                    root: this.root,
                    path: this.path
                });
                arch.setNode(bundleNode, arch.getParents(this));
            }

            // generate targets for page files
            var techTargets = {};
            this.getTechs().map(function(tech) {
                var techNode = this.createTechNode(tech, bundleNode, this);
                if (techNode) {
                    techTargets[tech] = techNode.getId();
                    this.createOptimizerNode(tech, techNode, bundleNode);
                }
            }, this);

            // link targets for page files with each other
            // FIXME: rewrite, move linking to create*() methods
            return this.linkNodes(techTargets);
        };

    },

    lastModified: function() {
        return Q.resolve(0);
    },

    createTechNode: function(tech, bundleNode, magicNode) {

        var f = 'create-' + tech + '-node';
        f = typeof this[f] === 'function'? f : 'createDefaultTechNode';

        LOGGER.fdebug('Using %s() to create node for tech %s', f, tech);

        return this[f].apply(this, arguments);

    },

    createOptimizerNode: function(tech, sourceNode, bundleNode) {

        var f = 'create-' + tech + '-optimizer-node';
        f = typeof this[f] === 'function'? f : 'createDefaultOptimizerNode';

        LOGGER.fdebug('Using %s() to create optimizer node for tech %s', f, tech);

        return this[f].apply(this, arguments);

    },

    linkNodes: function(techTargets) {
        var arch = this.ctx.arch;
        return Q.all(Object.keys(techTargets).map(function(target) {
            var targetNode = arch.getNode(techTargets[target]);
            if (targetNode.getCreateDependencies)
                return Q.when(targetNode.getCreateDependencies(), function(deps) {
                    for(var d = 0; d < deps.length; d++) {
                        if (!arch.hasNode(deps[d])) continue;
                        arch.addParents(deps[d], techTargets[target]);
                    }
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

    cleanup: function() {
        var arch = this.ctx.arch;
        if (!arch.hasNode(this.path)) return;
        arch.removeTree(this.path);
    },

    getLevels: function(prefix) {
        return [].concat(
            this.level.getConfig().bundleBuildLevels,
            [ PATH.join(PATH.dirname(prefix), 'blocks') ]);
    },

    useFileOrBuild: function(node) {
        var deps = node.getCreateDependencies();

        for(var i = 0; i < deps.length; i++) {
            var d = deps[i];

            if (!this.ctx.arch.hasNode(d)) {
                LOGGER.fverbose('Dependency %s is required to build %s but does not exist, checking if target already built', d, node.getId());

                if (!PATH.existsSync(node.getPath())) {
                    LOGGER.fwarn('%s will not be built because dependency file %s does not exist', node.path, d);
                    return null;
                }

                return new FileNode({
                    root: this.root,
                    path: node.getId()
                });
            }
        }

        return node;
    },

    /**
     * Create a bem build node, add it to the arch,
     * then creates a meta node and link it to the build node.
     *
     * @param techName
     * @param techPath
     * @param declPath
     * @param {String} bundleNode
     * @param {String} magicNode
     * @param {Boolean} [forked]
     * @return {String} ID of the node that has been created
     */
    setBemBuildNode: function(techName, techPath, declPath, bundleNode, magicNode, forked) {

        var arch = this.ctx.arch,
            buildNode = new BemBuildNode({
                root: this.root,
                bundlesLevel: this.level,
                levels: this.getLevels(PATH.resolve(this.root, this.getNodePrefix())),
                declPath: declPath,
                techPath: techPath,
                techName: techName,
                output: this.getNodePrefix(),
                forked: forked
            });

        arch.setNode(buildNode);

        bundleNode && arch.addParents(buildNode, bundleNode);
        magicNode && arch.addChildren(buildNode, magicNode);

        arch.setNode(buildNode.getMetaNode(), buildNode, declPath);

        return buildNode;

    },

    createDefaultTechNode: function(tech, bundleNode, magicNode) {

        return this.setBemBuildNode(
            tech,
            this.level.resolveTech(tech),
            this.getBundlePath('deps.js'),
            bundleNode,
            magicNode);

    },

    'create-bemjson.js-node': function(tech, bundleNode, magicNode) {

        var arch = this.ctx.arch,
            filePath = this.getBundlePath(tech);

        if (!PATH.existsSync(PATH.resolve(this.root, filePath))) return;

        var node = new FileNode({
            root: this.root,
            path: filePath
        });

        arch.setNode(node);

        bundleNode && arch.addParents(node, bundleNode);
        magicNode && arch.addChildren(node, magicNode);

        return node;

    },

    'create-bemdecl.js-node': function(tech, bundleNode, magicNode) {

        var arch = this.ctx.arch,
            node = this.useFileOrBuild(new BemCreateNode({
                root: this.root,
                level: this.level,
                item: this.item,
                techPath: this.level.resolveTech(tech),
                techName: tech
            }));

        if (!node) return;

        arch.setNode(node);

        bundleNode && arch.addParents(node, bundleNode);
        magicNode && arch.addChildren(node, magicNode);

        return node;

    },

    'create-deps.js-node': function(tech, bundleNode, magicNode) {

        return this.setBemBuildNode(
            tech,
            this.level.resolveTech(tech),
            this.getBundlePath('bemdecl.js'),
            bundleNode,
            magicNode);

    },

    'create-html-node': function(tech, bundleNode, magicNode) {

        // TODO: move node to bem-bl/blocks-common/i-bem/bem
        var arch = this.ctx.arch,
            node = this.useFileOrBuild(new BemCreateNode({
                root: this.root,
                level: this.level,
                item: this.item,
                techPath: this.level.resolveTech(tech),
                techName: tech,
                force: true
            }));

        if (!node) return;

        arch.setNode(node);

        bundleNode && arch.addParents(node, bundleNode);
        magicNode && arch.addChildren(node, magicNode);

        return node;

    },

    createDefaultOptimizerNode: function(tech, sourceNode, bundleNode) {},

    'create-js-optimizer-node': function(tech, sourceNode, bundleNode) {

        LOGGER.fdebug('Creating borschik node for %s', sourceNode.getId());

        var node = new (registry.getNodeClass('BorschikNode'))({
            root: this.root,
            sourceNode: sourceNode,
            tech: 'js',
            forked: true
        });

        this.ctx.arch
            .setNode(node)
            .addParents(node, bundleNode)
            .addChildren(node, sourceNode);

        return node;

    },

    'create-priv.js-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this['create-js-optimizer-node'].apply(this, arguments);
    },

    'create-css-optimizer-node': function(tech, sourceNode, bundleNode) {

        LOGGER.fdebug('Creating borschik node for %s', sourceNode.getId());

        var node = new (registry.getNodeClass('BorschikNode'))({
            root: this.root,
            sourceNode: sourceNode,
            tech: 'css-fast',
            forked: true
        });

        this.ctx.arch
            .setNode(node)
            .addParents(node, bundleNode)
            .addChildren(node, sourceNode);

        return node;

    },

    'create-ie.css-optimizer-node': function(tech, sourceNode, bundleNode) {

        var node = this['create-css-optimizer-node'].apply(this, arguments);
        this.ctx.arch.addChildren(node, this.getBundlePath('css'));
        return node;

    },

    'create-ie6.css-optimizer-node': function(tech, sourceNode, bundleNode) {

        var node = this['create-ie.css-optimizer-node'].apply(this, arguments);
        this.ctx.arch.addChildren(node, this.getBundlePath('ie.css'));
        return node;

    },

    'create-ie7.css-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this['create-ie6.css-optimizer-node'].apply(this, arguments);
    },

    'create-ie8.css-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this['create-ie6.css-optimizer-node'].apply(this, arguments);
    },

    'create-ie9.css-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this['create-ie.css-optimizer-node'].apply(this, arguments);
    }

});
