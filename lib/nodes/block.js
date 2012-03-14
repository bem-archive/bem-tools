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
        if (!this._nodeSuffix) {
            this._nodeSuffix = PATH.join(PATH.basename(this.level.dir), this.level.getRelByObj(this.item));
        }
        return this._nodeSuffix;
    }

});

function createItem(bundleName) {
    var item = { block: bundleName };

    return item;
}