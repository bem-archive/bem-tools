var INHERIT = require('inherit'),
    PATH = require('path'),
    createLevel = require('../index').createLevel,
    MagicNode = require('./magic').MagicNode;

var BlockNode = exports.BlockNode = INHERIT(MagicNode, {

    __constructor: function(level, blockNameOrItem) {
        this.level = typeof level == 'string'? createLevel(level) : level;

        this.item = (typeof blockNameOrItem === 'string')? createItem(blockNameOrItem) : blockNameOrItem;

        this.__base(PATH.dirname(this.getNodePrefix()));
    },

    make: function(ctx) {
        if (ctx.arch.hasNode(this.path)) return;

    },

    getNodePrefix: function() {
        if (!this._nodePrefix) {
            this._nodePrefix = createNodePrefix(this.level, this.item);
        }
        return this._nodePrefix;
    }

});

BlockNode.createId = function(level, blockNameOrItem) {
    return createNodePrefix(
        (typeof level == 'string')? createLevel(level) : level,
        (typeof blockNameOrItem === 'string')? createItem(blockNameOrItem) : blockNameOrItem);
};

function createNodePrefix(level, item) {
    return PATH.join(PATH.basename(level.dir), level.getRelByObj(item));
}

function createItem(bundleName) {
    var item = { block: bundleName };

    return item;
}