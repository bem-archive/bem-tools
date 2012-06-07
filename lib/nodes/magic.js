var Q = require('q'),
    INHERIT = require('inherit'),
    FileNode = require('./file').FileNode;

exports.MagicNode = INHERIT(FileNode, /** @lends MagicNode.prototype */ {

    /**
     * Verbosity of node log messages.
     * @type {String}
     */
    buildMessageVerbosity: 'verbose',

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
