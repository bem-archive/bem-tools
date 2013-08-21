'use strict';

var PATH = require('../path'),
    U = require('../util'),
    createLevel = require('../level').createLevel,

    registry = require('../nodesregistry'),
    MagicNode = require('./magic').MagicNodeName,

    BlockNodeName = exports.BlockNodeName = 'BlockNode';

/* jshint -W106 */
exports.__defineGetter__(BlockNodeName, function() {
    return registry.getNodeClass(BlockNodeName);
});
/* jshint +W106 */

registry.decl(BlockNodeName, MagicNode, {

    nodeType: 9,

    __constructor: function(o) {

        /* jshint -W106 */
        // Lazy level initialization for the cases when level config is not exists
        // at the time node object created
        var level;
        this.__defineGetter__('level', function() {
            if (!level) {
                level = typeof o.level === 'string' ?
                    createLevel(PATH.resolve(o.root, o.level), {
                        projectRoot: o.root
                    }) :
                    o.level;
            }
            return level;
        });
        /* jshint +W106 */

        this.item = o.item || o;

        this.__base(U.extend({ path: this.__self.createPath(o) }, o));

    },

    make: function() {},

    getNodePrefix: function() {

        if (!this._nodePrefix) {
            this._nodePrefix = this.__self.createNodePrefix({
                root: this.root,
                level: this.level,
                item: this.item
            });
        }
        return this._nodePrefix;

    },

    /**
     * returns the path of the block`s level relative to the project root
     * @return {*}
     */
    getLevelPath: function() {
        return PATH.relative(this.root, this.level.dir);
    }

}, {

    createId: function(o) {
        return this.createPath(o) + '*';
    },

    createPath: function(o) {
        return PATH.dirname(this.createNodePrefix(o));
    },

    createNodePrefix: function(o) {

        var level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level), {
                projectRoot: o.root
            }) :
            o.level;

        return PATH.relative(o.root, level.getByObj(o.item));

    }

});
