'use strict';

var Q = require('q'),
    FileNode = require('./file').FileNodeName,
    registry = require('../nodesregistry'),

    MagicNodeName = exports.MagicNodeName = 'MagicNode';

/* jshint -W106 */
exports.__defineGetter__(MagicNodeName, function() {
    return registry.getNodeClass(MagicNodeName);
});
/* jshint +W106 */

registry.decl(MagicNodeName, FileNode, /** @lends MagicNode.prototype */ {

    /**
     * Verbosity of node log messages.
     * @type {String}
     */
    buildMessageVerbosity: 'verbose',
    nodeType: 1,

    /**
     * clean() implementation.
     *
     * Forwards call to #make().
     *
     * @return {Promise * Undefined}
     */
    clean: function() {
        return this.make();
    },

    /**
     * isValid() implementation.
     *
     * @return {Promise * Boolean}  Node validity state (true if node is valid).
     */
    isValid: function() {
        return Q.resolve(false);
    },

    /**
     * lastModified() stub that always returns promised -1.
     *
     * @return {Promise * Number}
     */
    lastModified: function() {
        return Q.resolve(-1);
    }

}, /** @lends MagicNode */ {

    /**
     * Create node id.
     *
     * @param {Object} o  Node options.
     * @return {String}   Node id.
     */
    createId: function(o) {
        return this.__base(o) + '*';
    }

});
