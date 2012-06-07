var INHERIT = require('inherit'),
    PATH = require('path'),
    U = require('../util'),
    createLevel = require('../index').createLevel,
    MagicNode = require('./magic').MagicNode;

var BlockNode = exports.BlockNode = INHERIT(MagicNode, {

    __constructor: function(o) {

        this.level = typeof o.level === 'string'? createLevel(o.level) : o.level;
        this.item = o.item || o;
        this.__base(U.extend({ path: PATH.dirname(this.getNodePrefix(o)) }, o));

    },

    make: function() {},

    getNodePrefix: function(o) {

        if (!this._nodePrefix) {
            this._nodePrefix = this.__self.createNodePrefix(o || {
                root: this.root,
                level: this.level,
                item: this.item
            });
        }
        return this._nodePrefix;

    }

}, {

    createId: function(o) {

        o.path = o.path || this.createPath(o);
        return this.__base(o);

    },

    createPath: function(o) {
        return PATH.dirname(this.createNodePrefix(o));
    },

    createNodePrefix: function(o) {

        var level = typeof o.level === 'string'? createLevel(o.level) : o.level;
        return PATH.join(
            PATH.relative(o.root, level.dir),
            level.getRelByObj(o.item));

    }

});
