'use strict';

var UTIL = require('util'),
    PATH = require('./path'),
    U = require('./util'),
    LOGGER = require('./logger'),
    Q = require('qq'),
    registry = require('./nodesregistry'),
    level = require('./level'),

    node = require('./nodes/node'),
    libNodes = require('./nodes/lib'),
    seed = require('./nodes/seed'),

    createLevel = require('../index').createLevel,

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

    libraries: {},

    getLibraries: function() {
        return this.libraries;
    },

    getLevelCachePolicy: function() {
        return {
            cache: false,
            except: []
        };
    },

    alterArch: function() {
        var _this = this;

        return Q.step(
            function() {
                LOGGER.silly('Going to run createCommonNodes()');
                return Q.call(_this.createCommonNodes, _this);
            },

            function(common) {
                LOGGER.silly('Going to run createBlockLibrariesNodes()');
                return [
                    common,
                    Q.call(_this.createBlockLibrariesNodes, _this, common)
                ];
            },

            function(common, libs){
                LOGGER.silly("Adding build seed node");

                var node = new (registry.getNodeClass(seed.SeedNodeName))({
                    root: _this.root,
                    name: 'build',
                    deps: libs
                });

                _this.arch.setNode(node)
                    .addParents(node, common);

                return node;
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
    createCustomNodes: function(common, libs, seed) {
        // stub
    },
    /* jshint +W098 */

    createCommonNodes: function() {

        var all = new node.Node('all');
        this.arch.setNode(all);
        return all.getId();

    },

    createBlockLibrariesNodes: function(parent) {

        var libs = this.getLibraries(),
            libsNode = new (registry.getNodeClass(node.NodeName))('libs');

        this.arch.setNode(
            libsNode,
            parent,
            Object.keys(libs).map(function(l) {

                var lib = libs[l],
                    libNodeClass = U.toUpperCaseFirst(lib.type) + libNodes.LibraryNodeName,
                    libNode = new (registry.getNodeClass(libNodeClass))(U.extend({}, lib, {
                        root: this.root,
                        target: l
                    }));

                this.arch.setNode(libNode);

                return libNode.getId();

            }, this)
        );

        return libsNode.getId();
    }

});
