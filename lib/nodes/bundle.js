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
    EntityNode = require('./entity'),

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
                bundleNode,
                grouping = U.serializeBemPath(this.resolved);

            if (arch.hasNode(grouping)) {
                bundleNode = arch.getNode(grouping);
            } else {

                bundleNode = new fileNodes.FileNode({
                    root: this.root,
                    path: grouping
                });

                arch.setNode(bundleNode, arch.getParents(this).filter(function(p) {

                    // NOTE: We need this to avoid linking with Magic expandable parent nodes
                    // because it adds unnecessary execution of them.
                    //
                    // XXX: Overriding MagicNode with something like MAKE.decl('MagicNode', 'Node', {...})
                    // may lead to unpredictable results here.
                    return !(arch.getNode(p) instanceof MagicNode.MagicNode);

                }), this);

            }

            // generate targets for page files
            var optTechs = this.getOptimizerTechs();
            this.getTechs().map(function(tech) {
                var techNode = this.createTechNode(tech, bundleNode, this);
                if (techNode && ~optTechs.indexOf(tech)) {
                    this.createOptimizerNode(tech, techNode, bundleNode);
                }
            }, this);

            return Q.when(this.takeSnapshot('after alterArch BundleNode ' + this.getId()));

        };

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
     * Constructs array of levels to build tech from.
     *
     * @param {String} tech  Tech name.
     * @return {String[]}  Array of levels.
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

        for (var i = 0, l = deps.length; i < l; i++) {
            var d = deps[i];

            if (!this.ctx.arch.hasNode(d)) {
                LOGGER.fverbose('Dependency %s is required to build %s but does not exist, checking if target already built', d, node.getId());

                var paths = node.getPath();

                for(var i = 0; i < paths.length; i++) {
                    if (!PATH.existsSync(paths[i])) {
                        LOGGER.fwarn('%s will not be built because dependency file %s does not exist', node.getId(), paths[i]);
                        return null;
                    }
                }

                return node;
            }
        }

        return node;

    },

    getBundlePath: function(tech) {
        return this.getBlockPath(tech);
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
                level: this.level,
                item: U.extend({}, this.item, {tech: techName}),
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
                item: U.extend({}, this.item, {tech: techName}),
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
setEntityNode: function(tech, bundleNode, magicNode) {
        var arch = this.ctx.arch,
            filePath = this.getBundlePath(tech);

        if (!PATH.existsSync(PATH.resolve(this.root, filePath))) return;

        var node = new EntityNode.EntityNode({
            root: this.root,
            level: this.level,
            item: U.extend({}, this.item, {tech: tech, suffix: '.bemjson.js'})
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
            this.getBundleId('deps.js'),
            bundleNode,
            magicNode);

    },

    'create-bemjson.js-node': function(tech, bundleNode, magicNode) {
        return this.setEntityNode.apply(this, arguments);
    },

    /**
     * Creates a node for bemdecl tech.
     * @param {String} tech
     * @param {String} bundleNode
     * @param {String} magicNode
     * @return {Node | undefined}
     */
    'create-bemdecl.js-node': function(tech, bundleNode, magicNode) {

        return this.setBemCreateNode(
            tech,
            this.level.resolveTech(tech),
            bundleNode,
            magicNode);
    },

    /**
     * Creates a node for deps.js tech
     * @param {String} tech
     * @param {String} bundleNode
     * @param {String} magicNode
     * @return {Node | undefined}
     */
    'create-deps.js-node': function(tech, bundleNode, magicNode) {

        return this.setBemBuildNode(
            tech,
            this.level.resolveTech(tech),
            this.getBundleId('bemdecl.js'),
            bundleNode,
            magicNode);
    },

    /**
     * Creates a node for html tech
     * @param {String} tech
     * @param {String} bundleNode
     * @param {String} magicNode
     * @return {Node | undefined}
     */
    'create-html-node': function(tech, bundleNode, magicNode) {

        return this.setBemCreateNode(
            tech,
            this.level.resolveTech(tech),
            bundleNode,
            magicNode);

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
    }

});

var MergedBundleNodeName = exports.MergedBundleNodeName = 'MergedBundleNode';

/* jshint -W106 */
exports.__defineGetter__(MergedBundleNodeName, function() {
    return registry.getNodeClass(MergedBundleNodeName);
});
/* jshint +W106 */

registry.decl(MergedBundleNodeName, BundleNodeName, /** @lends MergedBundleNode.prototype */ {

    /**
     * Returns a tech name which should be merged. This merged bundle
     * implementation supports deps.js and bemdecl.js being there.
     * @return {Array}
     */
    getMergeTech: function() {
        return 'deps.js';
    },

    /**
     * Override and return an array of the bundle paths
     * to build custom merged bundle out of them.
     * All bundles of the merged bundle level will be used
     * by default.
     */
    getMergeBundles: function() {
        var arch = this.ctx.arch;
        return arch.getChildren(
            arch.getNode(PATH.relative(this.root, this.level.dir))
        );
    },

    make: function() {
        var path = PATH.resolve(this.root, this.path);

        if (!PATH.existsSync(path)) FS.mkdirSync(path);

        return this.__base();
    },

    /**
     * Overriden. When deps.js is returned by getMergeTech() BemDecl node will be created linked to the deps.js nodes of
     * the bundles within containing level. Base implementation is used otherwise.
     * @param {String} tech
     * @param {String} bundleNode
     * @param {String} magicNode
     * @return {Node | undefined}
     */
    'create-deps.js-node': function(tech, bundleNode, magicNode) {
        if (this.getMergeTech() !== tech) return this.__base(tech, bundleNode, magicNode);

        return this._createMergedTechNode(tech, bundleNode, magicNode);
    },

    /**
     * Overriden. When bemdecl.js is returned by getMergeTech() bemdecl merge node will be created.
     * Base implementation is used otherwise.
     * @param {String} tech
     * @param {String} bundleNode
     * @param {String} magicNode
     * @return {Node | undefined}
     */
    'create-bemdecl.js-node': function(tech, bundleNode, magicNode) {
        if (this.getMergeTech() !== tech) return this.__base(tech, bundleNode, magicNode);

        return this._createMergedTechNode(tech, bundleNode, magicNode);
    },


    /**
     * Creates a BemDecl node which builds merged bundle. The bundle will be built of the bundles returned by the
     * getMergeBundles() or in case it returns undefined all the bundles of the level will be used.
     * @param {String} tech
     * @param {String} bundleNode
     * @param {String} magicNode
     * @return {Node | undefined}
     * @private
     */
    _createMergedTechNode: function(tech, bundleNode, magicNode) {
        var ctx = this.ctx,
            arch = ctx.arch,
            levelNode = arch.getNode(PATH.relative(this.root, this.level.dir)),
            bundles = this.getMergeBundles()
                .filter(function(b) {
                    var n = arch.getNode(b);
                    return n instanceof exports.BundleNode && n !== this;
                }, this)
                .map(function(b) {
                    return arch.getNode(b).getBundlePath(tech);
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
     * @param {String} techName
     * @param {String} techPath
     * @param {String} bundleNode
     * @param {String} magicNode
     * @param {String} cmd Command to execute (merge or substract).
     * @param {String[]} decls Declaration paths to execute command on.
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
