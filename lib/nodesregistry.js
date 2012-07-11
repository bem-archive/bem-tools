var INHERIT = require('inherit'),
    LOGGER = require('./logger'),
    ASSERT = require('assert'),
    registry = {},
    cache = {};

var Make = exports.NodesRegistry = {

    // (nodeName, object)
    // (nodeName, object, static)
    // (nodeName, baseName, object)
    // (nodeName, baseName, object, static)

    _decl: function(nodeName, objectOrBaseName, objectOrStatic, staticObject) {
        var explicitBase = typeof objectOrBaseName === 'string',
            baseName = explicitBase? objectOrBaseName: nodeName,
            static = typeof objectOrBaseName !== 'string'? objectOrStatic: staticObject,
            object = explicitBase? objectOrStatic: objectOrBaseName,
            base;

        if (typeof baseName === 'string') {
            if (baseName == nodeName)
                base = cache[baseName];
            else
                base = this.getNodeClass(baseName);
        } else {
            base = baseName;
        }

        if (typeof objectOrStatic === 'function') {
            cache[nodeName] = objectOrStatic;
        } else {
            cache[nodeName] = base? INHERIT(base, object, static): INHERIT(object, static);
        }

        return cache;
    },

    _inheritChain: function(nodeName) {
        var stack = registry[nodeName];

        ASSERT.ok(Array.isArray(stack), 'definition for class ' + nodeName + ' is not found in the registry');

        for(var i = 0; i < stack.length; i++) {
            this._decl.apply(this, stack[i]);
        }

        return cache[nodeName];
    },

    decl: function(nodeName, objectOrBaseName, objectOrStatic, staticObject) {
        cache = {};

        var stack = registry[nodeName] || [];
        stack.push(Array.prototype.slice.call(arguments, 0));
        registry[nodeName] = stack;
    },

    getRegistry: function(node) {
        return node? registry[node] : registry;
    },


    getNodeClass: function(nodeName){
        return cache[nodeName] || this._inheritChain(nodeName);
    }

};
