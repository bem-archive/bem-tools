'use strict';

var UTIL = require('util'),
    PATH = require('./path'),
    U = require('./util'),
    LOGGER = require('./logger'),
    Q = require('q'),
    registry = require('./nodesregistry'),
    level = require('./level'),

    node = require('./nodes/node'),
    levelNodes = require('./nodes/level'),
    libNodes = require('./nodes/lib'),

    ArchName = exports.ArchName = 'Arch';

/* jshint -W106 */
exports.__defineGetter__(ArchName, function() {
    return registry.getNodeClass(ArchName);
});
/* jshint +W106 */

registry.decl('Arch', {

    __constructor: function(arch, opts) {
        this.arch = arch;
        this.root = opts.root;
        this.opts = opts;

        var policy = this.getLevelCachePolicy();
        level.setCachePolicy(policy.cache, policy.except);
    },

    bundlesLevelsRegexp: /^(pages.*|bundles.*)/i,
    blocksLevelsRegexp:  /^(blocks.*)/i,

    getLevelCachePolicy: function() {
        return {
            cache: false,
            except: []
        };
    },

    alterArch: function() {
        var _this = this;

        LOGGER.silly('Going to run createCommonNodes()');
        return Q.invoke(_this, 'createCommonNodes')
            .then(function(common) {
                LOGGER.silly('Going to run createUpdateDepsNode()');
                return [
                    common,
                    Q.invoke(_this, 'createUpdateDepsNode', common)
                ];
            })
            .spread(function(common, libs) {
                LOGGER.silly('Going to run createBlocksLevelsNodes()');
                return [
                    common,
                    libs,
                    Q.invoke(_this, 'createBlocksLevelsNodes', common, libs)
                ];
            })
            .spread(function(common, libs, blocks){
                LOGGER.silly('Going to run createBundlesLevelsNodes()');
                return [
                    common,
                    libs,
                    blocks,
                    Q.invoke(_this, 'createBundlesLevelsNodes', common, (libs || []).concat(blocks))
                ];
            })
            .spread(function(common, libs, blocks, bundles) {
                LOGGER.silly('Going to run createCustomNodes()');
                return Q.invoke(_this, 'createCustomNodes', common, libs, blocks, bundles);
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

    /* jshint -W098 */
    createCustomNodes: function(common, libs, blocks, bundles) {
        // stub
    },
    /* jshint +W098 */

    createCommonNodes: function() {
        var build = new node.Node('build'),
            all = new node.Node('all');

        this.arch
            .setNode(all)
            .setNode(build, all.getId());

        return build.getId();
    },

    createUpdateDepsNode: function(parent) {

        var bower = new libNodes.BowerNpmInstallNode({
            id: 'libs',
            root: this.root
        });

        this.arch.setNode(bower, parent);

        return [bower.getId()];
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

    createLevelsNodes: function(levels, NodeClass, parent, children) {

        var _this = this;

        return Q.when(levels)
            .then(function(levels) {

                return levels.map(function(level) {
                    var node = new NodeClass({
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
            .invoke('filter', function(dir) {
                return dir.match(mask);
            });

    }

});
