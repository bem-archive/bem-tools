var INHERIT = require('inherit'),

    FileNode = require('./file').FileNode;

exports.MagicNode = INHERIT(FileNode, {

    buildMessageVerbosity: 'verbose',

    getId: function() {
        return this.id + '*';
    },

    clean: function(ctx) {
        return this.make(ctx);
    },

    isValid: function(ctx) {
        return false;
    },

    lastModified: function() {
        return -1;
    }

}, {

    createId: function(id) {
        return id + '*';
    }

});
