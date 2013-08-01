'use strict';

var INHERIT = require('inherit');


module.exports = INHERIT(/** @lends FSMock.prototype */{

    /**
     * Creates new instance of a mock
     *
     * @class FSMock Partial implementation of fs module functionality on top ofqi/fs-mock
     * @constructor
     * @param {module:q-io/fs-mock} qfsMock instance of q-io/fs filesystem mock
     */
    __constructor: function(qfsMock) {
        this._qfsMock = qfsMock;
    },

    readdirSync: function(path) {
        path = this._qfsMock.absolute(path);
        var node = this._qfsMock._root._walk(path)._follow(path);
        if (!node.isDirectory()) {
            throw new Error("Can't list non-directory: " + JSON.stringify(path));
        }
        return Object.keys(node._entries).sort();
    },

    mkdirSync: function(path) {
        this._qfsMock.makeDirectory(path);
    },

    statSync: function(path) {
        path = this._qfsMock.absolute(path);
        var node = this._qfsMock._root._walk(path)._follow(path);
        node.mtime = node.lastModified();
        return node;
    },

    stat: function(path, callback) {
        this._qfsMock.stat(path)
            .then(function(stat) {
                callback(null, stat);
            })
            .fail(function(error) {
                callback(error);
            });
    },

    mkdir: function(path, mode, callback) {
        if (arguments.length === 2) {
            callback = arguments[1];
            mode = null;
        }
        this._qfsMock.makeDirectory(path, mode).then(callback, function(error) {
            if (!error.code) {
                //workaround for q-io/fs bug: https://github.com/kriskowal/q-io/pull/43
                error.code = "ENOENT";
            }
            callback(error);
        });
    }
});

