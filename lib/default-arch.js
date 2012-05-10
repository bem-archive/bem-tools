var INHERIT = require('inherit'),
    PATH = require('./path'),
    util = require('./util'),
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

    libraries: {
        "bem-bl": {
            type: 'git',
            url: 'git://github.com/bem/bem-bl.git',
            treeish: 'server'
        }
    },

    getLibraries: function() {
        return this.libraries;
    },

    alterArch: function() {
        var _this = this;

        return Q.step(
            function() {
                return Q.call(_this.createCommonNodes, _this);
            },

            function(common) {
                return [
                    common,
                    Q.call(_this.createBlockLibrariesNodes, _this, common)
                ];
            },

            function(common, libs) {
                return [
                    common,
                    libs,
                    Q.call(_this.createBlocksLevelsNodes, _this, common, libs)
                ]
            },

            function(common, libs, blocks){
                return Q.call(_this.createBundlesLevelsNodes, _this, common, (libs || []).concat(blocks));
            })

            .then(function() {
                LOGGER.info(_this.arch.toString());
                return _this.arch;
            });
    },

    createCommonNodes: function() {
        return this.arch.setNode(
            new (registry.getNodeClass('Node'))('build'),
            this.arch.setNode(new (registry.getNodeClass('Node'))('all')));
    },

    createBlockLibrariesNodes: function(parent) {
        var libs = this.getLibraries(),
            res = [];

        for (var l in libs) {
            var lib = libs[l],
                node = (lib.type === 'git')?'GitLibraryNode':'SvnLibraryNode';

            res.push(this.arch.setNode(
                new (registry.getNodeClass(node))(
                    this.absolutePath(l),
                    lib.url,
                    lib.paths,
                    lib.treeish),
                parent));
        }

        return res;
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

        return this.getLevels(mask).then(function(levels) {
            return levels.map(function(level) {
                return _this.arch.setNode(
                    new nodeClass(_this.absolutePath(level)),
                    parent,
                    children);
            });
        });
    },

    getLevels: function(mask) {
        return util.getDirsAsync(this.root)
            .invoke('filter', function(dir) {
                return dir.match(mask);
            });
    },

    absolutePath: function(path) {
        return PATH.join(this.root, path);
    }
});
