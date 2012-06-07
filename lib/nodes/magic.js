var INHERIT = require('inherit'),

    FileNode = require('./file').FileNode;

exports.MagicNode = INHERIT(FileNode, {

    buildMessageVerbosity: 'verbose',

    clean: function() {
        return this.make();
    },

    isValid: function() {
        return false;
    },

    lastModified: function() {
        return -1;
    }

}, {

    createId: function(o) {
        return this.__base(o) + '*';
    }

});
