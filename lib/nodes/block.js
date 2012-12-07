var INHERIT = require('inherit'),
    PATH = require('../path'),
    U = require('../util'),
    createLevel = require('../index').createLevel,

    registry = require('../nodesregistry'),
    MagicNode = require('./magic').MagicNodeName,

    BlockNodeName = exports.BlockNodeName = 'BlockNode';

exports.__defineGetter__(BlockNodeName, function() {
    return registry.getNodeClass(BlockNodeName);
});

registry.decl(BlockNodeName, MagicNode, {

    nodeType: 9,

    __constructor: function(o) {

        this.level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level)) :
            o.level;
        this.item = o.item || o;

        this.__base(U.extend({}, o, { path: this.__self.resolve(o) }));

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

    createNodePrefix: function(o) {

        var level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level)) :
            o.level;

        return PATH.relative(o.root, level.getByObj(o.item));

    }

});
