var INHERIT = require('inherit'),

    FileNode = require('./file').FileNode;

exports.MagicNode = INHERIT(FileNode, {

    getId: function() {
        return this.id + '*';
    },

    clean: function(ctx) {
        return this.make(ctx);
    },

    isValid: function(ctx) {
        return false;
    }

});
