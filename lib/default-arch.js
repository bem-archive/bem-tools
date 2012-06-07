var INHERIT = require('inherit'),
    PATH = require('./path'),
    U = require('./util'),
    LOGGER = require('./logger'),
    Q = require('qq'),
    registry = require('./make').NodesRegistry;

exports.Arch = INHERIT({

    __constructor: function(arch, root) {
        this.arch = arch;
        this.root = root;
    },

    bundlesLevelsRegexp: /^(pages.*|bundles.*)/i,
    blocksLevelsRegexp:  /^(blocks.*)/i,

    libraries: {},

    getLibraries: function() {
        return this.libraries;
    },

    alterArch: function() {
        var _this = this;

        return Q.step(
            function() {
                LOGGER.silly("Going to run createCommonNodes()");
                return Q.call(_this.createCommonNodes, _this);
            },

            function(common) {
                LOGGER.silly("Going to run createBlockLibrariesNodes()");
                return [
                    common,
                    Q.call(_this.createBlockLibrariesNodes, _this, common)
                ];
            },

            function(common, libs) {
                LOGGER.silly("Going to run createBlocksLevelsNodes()");
                return [
                    common,
                    libs,
                    Q.call(_this.createBlocksLevelsNodes, _this, common, libs)
                ]
            },

            function(common, libs, blocks){
                LOGGER.silly("Going to run createBundlesLevelsNodes()");
                return Q.call(_this.createBundlesLevelsNodes, _this, common, (libs || []).concat(blocks));
            })

            .then(function() {
                LOGGER.info(_this.arch.toString());
                return _this.arch;
            });
    },

    createCommonNodes: function() {
        var Node = registry.getNodeClass('Node'),
            build = new Node('build'),
            all = new Node('all');

        this.arch
            .setNode(all)
            .setNode(build, all.getId());

        return build.getId();
    },

    createBlockLibrariesNodes: function(parent) {

        var libs = this.getLibraries();
        return Object.keys(libs).map(function(l) {

            var lib = libs[l],
                libNodeClass = U.toUpperCaseFirst(lib.type) + 'LibraryNode',
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
            this.blocksLevelsRegexp,
            registry.getNodeClass('LevelNode'),
            parent,
            children
        );
    },

    createBundlesLevelsNodes: function(parent, children) {
        return this.createLevelsNodes(
            this.bundlesLevelsRegexp,
            registry.getNodeClass('BundlesLevelNode'),
            parent,
            children
        );
    },

    createLevelsNodes: function(mask, nodeClass, parent, children) {
        var _this = this;

        return this.getLevels(mask)
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

    getLevels: function(mask) {
        return U.getDirsAsync(this.root)
            .invoke('filter', function(dir) {
                return dir.match(mask);
            });
    }

});
