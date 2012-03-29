var INHERIT = require('inherit'),

    FileNode = require('./file').FileNode;

exports.MagicNode = INHERIT(FileNode, {

    getId: function() {
        return this.id + '*';
    },

    run: function(ctx) {
        if (ctx.arch.hasNode(this.path)) return;
        return this.__base(ctx);
    },

    clean: function(ctx) {
        return this.make(ctx);
    },

    isValid: function(ctx) {
        return ctx.arch.hasNode(this.path);
    }

});
