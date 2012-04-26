var INHERIT = require('inherit'),
    PATH = require('path'),
    UTIL = require('../util'),
    createLevel = require('../index').createLevel,
    MagicNode = require('./magic').MagicNode;

var BlockNode = exports.BlockNode = INHERIT(MagicNode, {

    __constructor: function(level, blockNameOrItem) {
        this.level = typeof level == 'string'? createLevel(level) : level;

        this.item = (typeof blockNameOrItem === 'string')? createItem(blockNameOrItem) : blockNameOrItem;

        this.__base(this.getNodePrefix());
    },

    make: function(ctx) {
        if (ctx.arch.hasNode(this.path)) return;

    },

    getNodePrefix: function() {
        if (!this._nodePrefix) {
            this._nodePrefix = this.__self._createId(this.level, this.item);
        }
        return this._nodePrefix;
    }

},
{
    createId: function(level, blockNameOrItem) {
        return this.__base(this._createId(level, blockNameOrItem));
    },

    _createId: function(level, blockNameOrItem) {
        return PATH.dirname(UTIL.getNodePrefix(
                    (typeof level == 'string')? createLevel(level) : level,
                    (typeof blockNameOrItem === 'string')? createItem(blockNameOrItem) : blockNameOrItem));
    }
});

function createItem(blockName) {
    var item = { block: blockName };

    return item;
}