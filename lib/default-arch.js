var INHERIT = require('inherit'),
    PATH = require('./path'),
    util = require('./util'),
    Q = require('q'),
    registry = require('./make').Registry;

exports.Arch = INHERIT({
    __constructor: function(arch, root) {
        this.arch = arch;
        this.root = root;
    },

    bundlesLevelsRegexp: /^(pages.*|bundles.*)/i,

    libraries: {
        "bem-bl": {
            type: 'git',
            url: 'git://github.com/bem/bem-bl.git',
            treeish: 'server'
        },

        "lego": {
            type: 'svn',
            url: 'svn+ssh://svn.yandex.ru/lego/versions/2.9/bem-bl',
            treeish: 'HEAD'
        }
    },

    getLibraries: function() {
        return this.libraries;
    },

    alterArch: function() {
        var _this = this;

        return Q.when(_this.createCommonNodes(),
            function(common) {
                return Q.when(_this.createBlockLibrariesNodes(common),
                    function(libs) {
                        return _this.createBundlesLevelsNodes(common, libs);
                    }
                )
            })
            .then(function() {
                return _this.arch;
            });
    },

    createCommonNodes: function() {
        var build;

        this.arch.setNode(new (registry.getNodeClass('LevelNode'))(PATH.resolve('blocks')),
            build = this.arch.setNode(
            new (registry.getNodeClass('Node'))('build'),
            this.arch.setNode(new (registry.getNodeClass('Node'))('all'))));

        return build;
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
                    lib.treeish),
                parent));
        }

        return res;
    },

    createBundlesLevelsNodes: function(parent, children) {
        var _this = this;

        return this.getBundlesLevels().then(function(levels) {
            return levels.map(function(level) {
                return _this.arch.setNode(new (registry.getNodeClass('BundlesLevelNode'))(_this.absolutePath(level)), parent, children);
            });
        });
    },

    getBundlesLevels: function() {
        var _this = this;
        return util.getDirsAsync(this.root)
            .invoke('filter', function(dir) {
                return dir.match(_this.bundlesLevelsRegexp);
            });
    },

    absolutePath: function(path) {
        return PATH.join(this.root, path);
    }
});
