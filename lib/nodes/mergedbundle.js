var Q = require('q'),
    INHERIT = require('inherit'),
    U = require('../util'),
    PATH = require('path'),
    FS = require('fs'),

    BundleNode = require('./bundle'),
    BemDeclNode = require('./decl'),
    registry = require('../nodesregistry').NodesRegistry,
    LOGGER = require('../logger'),

    MergedBundleNodeName = exports.MergedBundleNodeName = 'MergedBundleNode';

exports.__defineGetter__(MergedBundleNodeName, function() {
    return registry.getNodeClass(MergedBundleNodeName);
});

registry.decl(MergedBundleNodeName, BundleNode.BundleNodeName, /** @lends MergedBundleNode.prototype */ {

    make: function() {
        var path = PATH.resolve(this.root, this.path);

        if (!PATH.existsSync(path)) FS.mkdirSync(path);

        return this.__base();
    },

    'create-deps.js-node': function(tech, bundleNode, magicNode) {

        var ctx = this.ctx,
            arch = ctx.arch,
            levelNode = arch.getNode(PATH.relative(this.root, this.level.dir)),
            depsTech = this.level.getTech('deps.js').getTechName(),
            bundles = arch.getChildren(levelNode)
                .filter(function(b) {
                    var n = arch.getNode(b);
                    return n instanceof BundleNode.BundleNode && n !== this;
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
