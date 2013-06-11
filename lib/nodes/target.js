var Q = require('q'),
    INHERIT = require('inherit'),
    Node = require('./node').NodeName,
    registry = require('../nodesregistry'),

    TargetNodeName = exports.TargetNodeName = 'TargetNode';

exports.__defineGetter__(TargetNodeName, function() {
    return registry.getNodeClass(TargetNodeName);
});

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
