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
                var techNode = this.createNode(tech, bundleNode, this);
                if (techNode) {
                    techTargets[tech] = techNode.getId();
                    this.createOptimizerNode(tech, bundleNode, techNode);
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

    createNode: function(tech, bundleNode, magicNode) {
        var f = 'create-' + tech + '-node';

        LOGGER.fdebug('using %s() to create node for tech %s', this[f]?f:'createDefaultNode', tech);

        return (this[f] ||
            this.createDefaultNode).call(this, tech, bundleNode, magicNode);
    },

    createOptimizerNode: function(tech, bundleNode, sourceNode) {
        var f = 'create-' + tech + '-optimizer-node';

        LOGGER.fdebug('using %s() to create optimizer node for tech %s', this[f]?f:'createDefaultOptimizerNode', tech);

        return (this[f] ||
            this.createDefaultOptimizerNode).call(this, tech, sourceNode, bundleNode);
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
                LOGGER.fverbose('dependency %s is required to build %s but does not exist, checking if target already built', d, node.getId());

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
     * @param declTech
     * @param {String} bundleNode
     * @param {String} magicNode
     * @param {Boolean} [forked]
     * @return {String} ID of the node that has been created
     */
    setBemBuildNode: function(techName, techPath, declTech, bundleNode, magicNode, forked) {
        var arch = this.ctx.arch,
            buildNode = new BemBuildNode({
                root: this.root,
                bundlesLevel: this.level,
                levels: this.getLevels(PATH.resolve(this.root, this.getNodePrefix())),
                declPath: this.getBundlePath(declTech),
                techPath: techPath,
                techName: techName,
                output: this.getNodePrefix(),
                forked: forked
            });

        arch.setNode(buildNode);

        bundleNode && arch.addParents(buildNode, bundleNode);
        magicNode && arch.addChildren(buildNode, magicNode);

        arch.setNode(buildNode.getMetaNode(),
            buildNode,
            this.getBundlePath(declTech));

        return buildNode;
    },

    createDefaultNode: function(tech, bundleNode, magicNode) {
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
        var techPath = this.level.resolveTech(tech);
        return this.setBemBuildNode(tech, techPath, 'bemdecl.js', bundleNode, magicNode);
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

    'create-bemhtml.js-node': function(tech, bundleNode, magicNode) {
        // TODO: move node to bem-bl/blocks-common/i-bem/bem
        var techPath = this.level.resolveTech(tech);
        LOGGER.fdebug('techpath for tech %s is %s', tech, techPath);
        return this.setBemBuildNode(tech, techPath, 'deps.js', bundleNode, magicNode, true);
    },

    'create-js-node': function(tech, bundleNode, magicNode) {
        var techPath = this.level.resolveTech(tech);
        return this.setBemBuildNode(tech, techPath, 'deps.js', bundleNode, magicNode);
    },

    'create-css-node': function(tech, bundleNode, magicNode) {
        var techPath = this.level.resolveTech(tech);
        return this.setBemBuildNode(tech, techPath, 'deps.js', bundleNode, magicNode);
    },

    'create-ie.css-node': function(tech, bundleNode, magicNode) {
        return this['create-css-node'].apply(this, arguments);
    },

    createDefaultOptimizerNode: function(tech, sourceNode, bundleNode) {
    },

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
        var node = this['create-css-optimizer-node'](tech, sourceNode, bundleNode);

        this.ctx.arch.addChildren(node, this.getBundlePath('css'));

        return node;
    }

});
