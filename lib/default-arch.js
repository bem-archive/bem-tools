var INHERIT = require('inherit'),
    UTIL = require('util'),
    PATH = require('./path'),
    U = require('./util'),
    LOGGER = require('./logger'),
    Q = require('vow'),
    registry = require('./nodesregistry'),

    node = require('./nodes/node'),
    levelNodes = require('./nodes/level'),
    libNodes = require('./nodes/lib'),

    ArchName = exports.ArchName = 'Arch';

exports.__defineGetter__(ArchName, function() {
    return registry.getNodeClass(ArchName);
});

registry.decl('Arch', {

    __constructor: function(arch, opts) {
        this.arch = arch;
        this.root = opts.root;
        this.opts = opts;
    },

    bundlesLevelsRegexp: /^(pages.*|bundles.*)/i,
    blocksLevelsRegexp:  /^(blocks.*)/i,

    libraries: {},

    getLibraries: function() {
        return this.libraries;
    },

    alterArch: function() {
        var _this = this;

        LOGGER.silly("Going to run createCommonNodes()");

        return Q.when(_this.createCommonNodes())
            .then(function(common) {
                LOGGER.silly("Going to run createBlockLibrariesNodes()");
                return Q.all([
                    common,
                    Q.when(_this.createBlockLibrariesNodes(common))
                ]);
            }).spread(function(common, libs) {
                LOGGER.silly("Going to run createBlocksLevelsNodes()");
                return Q.all([
                    common,
                    libs,
                    Q.when(_this.createBlocksLevelsNodes(common, libs))
                ])
            }).spread(function(common, libs, blocks){
                LOGGER.silly("Going to run createBundlesLevelsNodes()");
                return Q.when(_this.createBundlesLevelsNodes(common, (libs || []).concat(blocks)));
            })

            .then(function() {
                return _this.opts.inspector && U.snapshotArch(
                    _this.arch,
                    PATH.join(_this.root, '.bem/snapshots/' + UTIL.format('%s_defaultArch alterArch.json', (new Date()-0))));
            })

            .then(function() {
                LOGGER.info(_this.arch.toString());
                return _this.arch;
            });
    },

    createCommonNodes: function() {
        var build = new node.Node('build'),
            all = new node.Node('all');

        this.arch
            .setNode(all)
            .setNode(build, all.getId());

        return build.getId();
    },

    createBlockLibrariesNodes: function(parent) {

        var libs = this.getLibraries();
        return Object.keys(libs).map(function(l) {

            var lib = libs[l],
                libNodeClass = U.toUpperCaseFirst(lib.type) + libNodes.LibraryNodeName,
                libNode = new (registry.getNodeClass(libNodeClass))(U.extend({}, lib, {
                        root: this.root,
                        target: l
                    }));

            this.arch.setNode(libNode, parent);
            return libNode.getId();

        }, this);

    },

    createBlocksLevelsNodes: function(parent, children) {

        return this.createLevelsNodes(
            this.getBlocksLevels(this.root),
            levelNodes.LevelNode,
            parent,
            children);

    },

    createBundlesLevelsNodes: function(parent, children) {

        return this.createLevelsNodes(
            this.getBundlesLevels(this.root),
            levelNodes.BundlesLevelNode,
            parent,
            children);

    },

    createLevelsNodes: function(levels, nodeClass, parent, children) {

        var _this = this;

        return Q.when(levels)
            .then(function(levels) {

                return levels.map(function(level) {
                    var node = new nodeClass({
                        root: _this.root,
                        level: level
                    });

                    _this.arch.setNode(node, parent, children);

                    return node.getId();
                });

            });

    },

    getBlocksLevels: function(from) {
        return this.getLevels(from, this.blocksLevelsRegexp);
    },

    getBundlesLevels: function(from) {
        return this.getLevels(from, this.bundlesLevelsRegexp);
    },

    getLevels: function(from, mask) {

        return U.getDirsAsync(from)
            .then(function(dirs) {
                return dirs.filter(function(dir) {
                    return dir.match(mask);
                });
            });

    }

});
