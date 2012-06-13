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
            this.getTechs().map(function(tech) {
                var techNode = this.createTechNode(tech, bundleNode, this);
                if (techNode) {
                    this.createOptimizerNode(tech, techNode, bundleNode);
                }
            }, this);

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

        var deps = node.getDependencies();

        for(var i = 0, l = deps.length; i < l; i++) {
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
     * Create a bem build node, add it to the arch, add
     * dependencies to it. Then create a meta node and link
     * it to the build node.
     *
     * @param {String} techName
     * @param {String} techPath
     * @param {String} declPath
     * @param {String} bundleNode
     * @param {String} magicNode
     * @param {Boolean} [forked]
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
            }),
            metaNode = buildNode.getMetaNode();

        // Set bem build node to arch
        arch.setNode(buildNode)
            .addChildren(buildNode, buildNode.getDependencies());

        bundleNode && arch.addParents(buildNode, bundleNode);
        magicNode && arch.addChildren(buildNode, magicNode);

        // Set bem build meta node to arch
        arch.setNode(metaNode)
            .addParents(metaNode, buildNode)
            .addChildren(metaNode, metaNode.getDependencies());

        return buildNode;

    },

    /**
     * Create a bem create node, add it to the arch,
     * add dependencies to it.
     *
     * @param {String} techName
     * @param {String} techPath
     * @param {String} bundleNode
     * @param {String} magicNode
     */
    setBemCreateNode: function(techName, techPath, bundleNode, magicNode) {

        var arch = this.ctx.arch,
            node = this.useFileOrBuild(new BemCreateNode({
                root: this.root,
                level: this.level,
                item: this.item,
                techPath: techPath,
                techName: techName
            }));

        if (!node) return;

        // Set bem create node to arch and add dependencies to it
        arch.setNode(node)
            .addChildren(node, node.getDependencies());

        bundleNode && arch.addParents(node, bundleNode);
        magicNode && arch.addChildren(node, magicNode);

        return node;

    },

    /**
     * Create file node, add it to the arch, add dependencies to it.
     *
     * @param {String} tech
     * @param {String} bundleNode
     * @param {String} magicNode
     */
    setFileNode: function(tech, bundleNode, magicNode) {

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

    createDefaultTechNode: function(tech, bundleNode, magicNode) {

        return this.setBemBuildNode(
            tech,
            this.level.resolveTech(tech),
            this.getBundlePath('deps.js'),
            bundleNode,
            magicNode);

    },

    createDefaultOptimizerNode: function(tech, sourceNode, bundleNode) {},

    'create-bemjson.js-node': function(tech, bundleNode, magicNode) {
        return this.setFileNode.apply(this, arguments);
    },

    'create-bemdecl.js-node': function(tech, bundleNode, magicNode) {

        return this.setBemCreateNode(
            tech,
            this.level.resolveTech(tech),
            bundleNode,
            magicNode);

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

        return this.setBemCreateNode(
            tech,
            this.level.resolveTech(tech),
            bundleNode,
            magicNode);

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

    'create-priv.js-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this['create-js-optimizer-node'].apply(this, arguments);
    },

    'create-bemhtml.js-optimizer-node': function(tech, sourceNode, bundleNode) {
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
