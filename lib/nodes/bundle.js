'use strict';

var Q = require('q'),
    U = require('../util'),
    PATH = require('../path'),
    FS = require('fs'),

    BlockNode = require('./block').BlockNodeName,
    fileNodes = require('./file'),
    BemCreateNode = require('./create'),
    BemBuildNode = require('./build'),
    BemDeclNode = require('./decl'),
    BorschikNode = require('./borschik'),
    MagicNode = require('./magic'),

    registry = require('../nodesregistry'),
    LOGGER = require('../logger'),

    BundleNodeName = exports.BundleNodeName = 'BundleNode';

/* jshint -W106 */
exports.__defineGetter__(BundleNodeName, function() {
    return registry.getNodeClass(BundleNodeName);
});
/* jshint +W106 */

registry.decl(BundleNodeName, BlockNode, /** @lends BundleNode.prototype */ {

    nodeType: 6,

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
                bundleNode = new fileNodes.FileNode({
                    root: this.root,
                    path: this.path
                });
                arch.setNode(bundleNode, arch.getParents(this).filter(function(p) {
                    return !(arch.getNode(p) instanceof MagicNode.MagicNode);
                }), this);
            }

            // generate targets for page files
            var optTechs = this.getOptimizerTechs(),
                usedSuffixes = {};
            this.getTechs().forEach(function(tech) {

                this.level.getTech(tech).getBuildSuffixes().forEach(function(suffix) {
                    (usedSuffixes[suffix] || (usedSuffixes[suffix] = [])).push(tech);
                });

                var techNode = this.createTechNode(tech, bundleNode, this);
                if (techNode && ~optTechs.indexOf(tech)) {
                    this.createOptimizerNode(tech, techNode, bundleNode);
                }
            }, this);

            Object.keys(usedSuffixes).forEach(function(suffix) {
                if (usedSuffixes[suffix].length > 1) LOGGER.fwarn('Bundle %s is configured to build techs %s ' +
                    'which have common build suffix %s. Consider using only one of these techs.',
                    this.path,
                    usedSuffixes[suffix].join(', '),
                    suffix);
            }, this);

            return Q.when(this.takeSnapshot('after alterArch BundleNode ' + this.getId()));
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
            'bemhtml',
            'css',
            'ie.css',
            'js',
            'html'
        ];
    },

    /**
     * Returns an array of the techs to build in a forked process. The techs not in the list will be built inprocess.
     * @return {Array}
     */
    getForkedTechs: function() {
        return [
            'bemhtml'
        ];
    },

    getOptimizerTechs: function() {
        return this.getTechs();
    },

    cleanup: function() {
        var arch = this.ctx.arch;
        if (!arch.hasNode(this.path)) return;
        arch.removeTree(this.path);
    },

    /**
     * Constructs array of levels to build tech from.
     *
     * @param {String} tech  Tech name.
     * @return {Array}  Array of levels.
     */
    getLevels: function(tech) {
        return (this.level.getConfig().bundleBuildLevels || [])
            .concat([PATH.resolve(this.root, PATH.dirname(this.getNodePrefix()), 'blocks')]);
    },

    /**
     * Checks that dependencies for specified node are met (appropriate nodes exist in the arch) or that node's file is
     * already exists on the file system.
     * @param node
     * @return {Node} Specified node if dependencies are met, FileNode if not but file does exist, null otherwise.
     */
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

                return new fileNodes.FileNode({
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
     * @return {Node}
     */
    setBemBuildNode: function(techName, techPath, declPath, bundleNode, magicNode, forked) {

        var arch = this.ctx.arch,
            buildNode = new BemBuildNode.BemBuildNode({
                root: this.root,
                bundlesLevel: this.level,
                levels: this.getLevels(techName),
                declPath: declPath,
                techPath: techPath,
                techName: techName,
                output: this.getNodePrefix(),
                forked: forked === undefined? ~this.getForkedTechs().indexOf(techName): forked
            });

        var tech = this.level.getTech(techName, techPath),
            metaNode;

        /* techs-v2: don't create meta node */
        if (tech.API_VER !== 2) metaNode = buildNode.getMetaNode();

        // Set bem build node to arch and add dependencies to it
        arch.setNode(buildNode)
            .addChildren(buildNode, buildNode.getDependencies());

        // Add file aliases to arch and link with buildNode as parents
        buildNode.getFiles().forEach(function(f) {

            if (buildNode.getId() === f) return;

            var alias = new fileNodes.FileNode({ path: f, root: this.root });
            arch.setNode(alias).addParents(buildNode, alias);

        }, this);

        bundleNode && arch.addParents(buildNode, bundleNode);
        magicNode && arch.addChildren(buildNode, magicNode);

        /* techs-v2: don't add dependency on meta node */
        if (metaNode) {
            // Set bem build meta node to arch
            arch.setNode(metaNode)
                .addParents(metaNode, buildNode)
                .addChildren(metaNode, metaNode.getDependencies());
        }

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
     * @param {Boolean} [force]
     * @param {Boolean} [forked]
     * @return {Node | undefined}
     */
    setBemCreateNode: function(techName, techPath, bundleNode, magicNode, force, forked) {

        var arch = this.ctx.arch,
            node = this.useFileOrBuild(new BemCreateNode.BemCreateNode({
                root: this.root,
                level: this.level,
                item: this.item,
                techPath: techPath,
                techName: techName,
                force: force,
                forked: forked === undefined? ~this.getForkedTechs().indexOf(techName): forked
            }));

        if (!node) return;

        // Set bem create node to arch and add dependencies to it
        arch.setNode(node)
            .addChildren(node, node.getDependencies());

        // Add file aliases to arch and link with node as parents
        node.getFiles && node.getFiles().forEach(function(f) {

            if (node.getId() === f) return;

            var alias = new fileNodes.FileNode({ path: f, root: this.root });
            arch.setNode(alias).addParents(node, alias);

        }, this);

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
     * @return {Node | undefined}
     */
    setFileNode: function(tech, bundleNode, magicNode) {

        var arch = this.ctx.arch,
            filePath = this.getBundlePath(tech);

        if (!PATH.existsSync(PATH.resolve(this.root, filePath))) return;

        var node = new fileNodes.FileNode({
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

                this.ctx.arch
                    .setNode(node)
                    .addParents(node, bundleNode)
                    .addChildren(node, sourceNode);

                return node;

            }, this);

    },

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
        return this.createBorschikOptimizerNode('js', sourceNode, bundleNode);
    },

    'create-browser.js+bemhtml-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this['create-js-optimizer-node'].apply(this, arguments);
    },

    'create-priv.js-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this['create-js-optimizer-node'].apply(this, arguments);
    },

    'create-bemhtml-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this['create-js-optimizer-node'].apply(this, arguments);
    },

    'create-bemhtml.js-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this['create-bemhtml-optimizer-node'].apply(this, arguments);
    },

    'create-css-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this.createBorschikOptimizerNode('css', sourceNode, bundleNode);
    },

    'create-ie.css-optimizer-node': function(tech, sourceNode, bundleNode) {

        var nodes = this['create-css-optimizer-node'].apply(this, arguments);
        this.ctx.arch.link(this.getBundlePath('css'), nodes);
        return nodes;

    },

    'create-ie6.css-optimizer-node': function(tech, sourceNode, bundleNode) {

        var nodes = this['create-ie.css-optimizer-node'].apply(this, arguments);
        this.ctx.arch.link(this.getBundlePath('ie.css'), nodes);
        return nodes;

    },

    'create-ie7.css-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this['create-ie6.css-optimizer-node'].apply(this, arguments);
    },

    'create-ie8.css-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this['create-ie6.css-optimizer-node'].apply(this, arguments);
    },

    'create-ie9.css-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this['create-ie.css-optimizer-node'].apply(this, arguments);
    },

    'create-less-optimizer-node': function(tech, sourceNode, bundleNode) {
        return this['create-css-optimizer-node'].apply(this, arguments);
    }

});

var MergedBundleNodeName = exports.MergedBundleNodeName = 'MergedBundleNode';

/* jshint -W106 */
exports.__defineGetter__(MergedBundleNodeName, function() {
    return registry.getNodeClass(MergedBundleNodeName);
});
/* jshint +W106 */

registry.decl(MergedBundleNodeName, BundleNodeName, /** @lends MergedBundleNode.prototype */ {

    make: function() {
        var path = PATH.resolve(this.root, this.path);

        if (!PATH.existsSync(path)) FS.mkdirSync(path);

        return this.__base();
    },

    /**
     * Overriden. Creates BemDecl node linked to the deps.js nodes of the bundles within containing level.
     * @param tech
     * @param bundleNode
     * @param magicNode
     * @return {*}
     */
    'create-deps.js-node': function(tech, bundleNode, magicNode) {

        var ctx = this.ctx,
            arch = ctx.arch,
            levelNode = arch.getNode(PATH.relative(this.root, this.level.dir)),
            depsTech = this.level.getTech('deps.js').getTechName(),
            bundles = arch.getChildren(levelNode)
                .filter(function(b) {
                    var n = arch.getNode(b);
                    return n instanceof exports.BundleNode && n !== this;
                }, this)
                .map(function(b) {
                    return U.getNodeTechPath(this.level, arch.getNode(b).item, depsTech);
                }, this);

        return this.setBemDeclNode(
            tech,
            this.level.resolveTech(tech),
            bundleNode,
            magicNode,
            'merge',
            bundles);

    },

    /**
     * Creates BemDecl node which maps to 'bem decl [cmd] [decls]'.
     * @param techName
     * @param techPath
     * @param bundleNode
     * @param magicNode
     * @param cmd Command to execute (merge or substract).
     * @param decls Declaration paths to execute command on.
     * @param [force]
     * @return {Node | undefined}
     */
    setBemDeclNode: function(techName, techPath, bundleNode, magicNode, cmd, decls, force) {

        var arch = this.ctx.arch,
            node = this.useFileOrBuild(new BemDeclNode.BemDeclNode({
                root: this.root,
                level: this.level,
                item: this.item,
                techPath: techPath,
                techName: techName,
                cmd: cmd,
                decls: decls,
                force: force
            }));

        if (!node) return;

        // Set bem create node to arch and add dependencies to it
        arch.setNode(node)
            .addChildren(node, node.getDependencies());

        bundleNode && arch.addParents(node, bundleNode);
        magicNode && arch.addChildren(node, magicNode);

        return node;
    }

});
