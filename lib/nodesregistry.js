'use strict';

var INHERIT = require('inherit'),
    ASSERT = require('assert'),
    LOGGER = require('./logger'),

    registry = {},
    cache = {};

module.exports = {

    /**
     * Calls INHERIT for specified parameters set and put the result into cache.
     *
     * @param {String} nodeName Name of the node
     * @param {Object|String}  objectOrBaseName Object definition or name of the class to inherit from
     * @param {Object|Object} objectOrStatic Object with static members definition|object definition
     * @param {Object} staticObject Object with static members definition
     * @return {Object} cache
     * @private
     */
    _decl: function(nodeName, objectOrBaseName, objectOrStatic, staticObject) {

        var explicitBase = typeof objectOrBaseName === 'string',
            baseName = explicitBase? objectOrBaseName : nodeName,
            staticObj = typeof objectOrBaseName !== 'string'? objectOrStatic: staticObject,
            obj = explicitBase? objectOrStatic : objectOrBaseName,
            base = baseName;

        if (typeof baseName === 'string') {
            base = baseName === nodeName? cache[baseName] : this.getNodeClass(baseName);
        }

        if (typeof objectOrStatic === 'function') {
            cache[nodeName] = objectOrStatic;
        } else {
            cache[nodeName] = base? INHERIT(base, obj, staticObj) : INHERIT(obj, staticObj);
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

    /**
     * Stores specified arguments into registry for further processing with INHERIT.
     *
     * @param {String} nodeName Name of the node
     * @param {Object|String}  objectOrBaseName Object definition or name of the class to inherit from
     * @param {Object|Object} objectOrStatic Object with static members definition|object definition
     * @param {Object} staticObject Object with static members definition
     */
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
