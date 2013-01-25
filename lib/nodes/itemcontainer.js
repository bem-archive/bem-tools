var Q = require('q'),
    QFS = require('q-fs'),
    INHERIT = require('inherit'),
    PATH = require('path'),
    U = require('../util'),
    LOGGER = require('../logger'),

    createLevel = require('../index').createLevel,

    registry = require('../nodesregistry'),
    EntityNode = require('./entity').EntityNodeName,

    ItemContainerNodeName = exports.ItemContainerNodeName = 'ItemContainerNode';

exports.__defineGetter__(ItemContainerNodeName, function() {
    return registry.getNodeClass(ItemContainerNodeName);
});

registry.decl(ItemContainerNodeName, EntityNode, {

    __constructor: function(o) {
        this.__base(o);
        this.resolved[this.resolved.length-1].tech = 'dummy';
    },

    getPaths: function() {
        return [PATH.dirname(this.__base()[0])];
    }

}, {
    createId: function(o) {
        return this.__base(o).replace(/\.dummy$/, '');
    }
});

