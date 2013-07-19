'use strict';

var Q = require('q'),
    QFS = require('q-io/fs'),
    PATH = require('path'),
    UTIL = require('util'),
    LOGGER = require('../logger'),
    registry = require('../nodesregistry'),

    Node = require('./node').NodeName,

    FileNodeName = exports.FileNodeName = 'FileNode';

/* jshint -W106 */
exports.__defineGetter__(FileNodeName, function() {
    return registry.getNodeClass(FileNodeName);
});
/* jshint +W106 */

registry.decl(FileNodeName, Node, /** @lends FileNode.prototype */ {

    /**
     * Verbosity of node log messages.
     * @type {String}
     */
    buildMessageVerbosity: 'verbose',
    nodeType: 4,

    /**
     * FileNode instance constructor.
     *
     * @class Node base class.
     * @constructs
     * @param {Object} o  Node options.
     */
    __constructor: function(o) {
        this.__base(o);
        this.root = o.root;
        this.path = o.path;
    },

    /**
     * Get absolute path of file represented by this node.
     *
     * @return {String}
     */
    getPath: function() {
        return PATH.resolve(this.root, this.path);
    },

    /**
     * make() implementation.
     *
     * @return {Promise * Undefined}
     */
    make: function() {

        var _this = this;
        return QFS.exists(this.getPath())
            .then(function(exists) {
                if (!exists) return Q.reject(UTIL.format('make error: Path %j doesn\'t exist', _this.getPath()));
            });

    },

    /**
     * Get file mtime in milliseconds or -1 in case of file doesn't exist.
     *
     * @return {Promise * Number}
     */
    lastModified: function() {

        return QFS.lastModified(this.getPath())
            .fail(function() {
                return -1;
            });

    }

}, /** @lends FileNode */ {

    /**
     * Create node id.
     *
     * @param {Object} o  Node options.
     * @return {String}   Node id.
     */
    createId: function(o) {
        return o.path;
    }

});

var GeneratedFileNodeName = exports.GeneratedFileNodeName = 'GeneratedFileNode';

/* jshint -W106 */
exports.__defineGetter__(GeneratedFileNodeName, function() {
    return registry.getNodeClass(GeneratedFileNodeName);
});
/* jshint +W106 */

registry.decl(GeneratedFileNodeName, FileNodeName, /** @lends GeneratedFileNode.prototype */ {

    /**
     * Verbosity of node log messages.
     * @type {String}
     */
    buildMessageVerbosity: 'info',

    /**
     * isValid() implementation.
     *
     * @return {Promise * Boolean}  Node validity state (true if node is valid).
     */
    isValid: function() {

        if (this.ctx.method && this.ctx.method !== 'make') return Q.resolve(false);
        if (this.ctx.force) return Q.resolve(false);

        var arch = this.ctx.arch,
            parent = this.lastModified(),
            children = arch.getChildren(this)
                .filter(function(child) {
                    return (child && (arch.getNode(child)) instanceof exports.FileNode);
                })
                .map(function(child) {
                    return arch.getNode(child).lastModified();
                });

        // with no deps we must always check for file existance
        // isValid() == false will guarantee it
        if (!children.length) return Q.resolve(false);

        var _this = this;
        return Q.all([parent].concat(children)).then(function(all) {
            var cur = all.shift(),
                max = Math.max.apply(Math, all);

            LOGGER.fdebug('*** isValid(%s): cur=%s, max=%s, valid=%s', _this.getId(), cur, max, cur >= max && max > -1);
            return cur >= max && max > -1;
        });

    },

    /**
     * make() implementation.
     *
     * Should not be removed because of FileNode has
     * its own implementation that must be overriden.
     *
     * @returns {Promise * Undefined}
     */
    make: function() {
        return Q.resolve();
    },

    /**
     * clean() implementation.
     * @return {Promise * Undefined}
     */
    clean: function() {

        var _this = this;
        return QFS.remove(this.getPath())
            .then(function() {
                LOGGER.fverbose('[-] Removed %j', _this.getId());
            })
            .fail(function() {});

    }

});
