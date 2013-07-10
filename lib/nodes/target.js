'use strict';

var Node = require('./node').NodeName,
    registry = require('../nodesregistry'),

    TargetNodeName = exports.TargetNodeName = 'TargetNode';

/* jshint -W106 */
exports.__defineGetter__(TargetNodeName, function() {
    return registry.getNodeClass(TargetNodeName);
});
/* jshint +W106 */

registry.decl(TargetNodeName, Node, /** @lends TargetNode.prototype */ {

    /**
     * Verbosity of node log messages.
     * @type {String}
     */
    buildMessageVerbosity: 'verbose',
    nodeType: 1

}, /** @lends MagicNode */ {

    /**
     * Create node id.
     *
     * @param {Object} o  Node options.
     * @return {String}   Node id.
     */
    createId: function(o) {
        return '$' + this.__base(o);
    }

});
