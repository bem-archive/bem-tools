var Q = require('q'),
    QFS = require('q-fs'),
    INHERIT = require('inherit'),
    PATH = require('path'),
    UTIL = require('util'),
    LOGGER = require('../logger'),

    Node = require('./node').Node;

var FileNode = exports.FileNode = INHERIT(Node, {

    buildMessageVerbosity: 'verbose',

    __constructor: function(o) {
        this.__base(o);
        this.root = o.root;
        this.path = o.path;
    },

    getPath: function() {
        return PATH.resolve(this.root, this.path);
    },

    make: function() {

        var _this = this;
        return QFS.exists(this.getPath())
            .then(function(exists) {
                if (!exists) return Q.reject(UTIL.format("Path %j doesn't exist", _this.getPath()));
            });

    },

    lastModified: function() {

        return QFS.lastModified(this.getPath())
            .fail(function() {
                return -1;
            });

    }

}, {

    createId: function(o) {
        return o.path;
    }

});

exports.GeneratedFileNode = INHERIT(FileNode, {

    buildMessageVerbosity: 'info',

    isValid: function() {

        if (this.ctx.method && this.ctx.method != 'make') return false;
        if (this.ctx.force) return false;

        var arch = this.ctx.arch,
            parent = this.lastModified(),
            children = arch.getChildren(this)
                .filter(function(child) {
                    return (child && (arch.getNode(child)) instanceof FileNode);
                })
                .map(function(child) {
                    return arch.getNode(child).lastModified();
                });

        // with no deps we must always check for file existance
        // isValid() == false will guarantee it
        if (!children.length) return false;

        var _this = this;
        return Q.all([parent].concat(children)).then(function(all) {
            var cur = all.shift(),
                max = Math.max.apply(Math, all);

            LOGGER.fdebug('*** isValid(%s): cur=%s, max=%s, valid=%s', _this.getId(), cur, max, cur >= max && max > -1);
            return cur >= max && max > -1;
        });

    },

    make: function() {},

    clean: function() {

        var _this = this;
        return QFS.remove(this.getPath())
            .then(function() {
                LOGGER.fverbose('Removed %j', _this.getId());
            })
            .fail(function() {});

    }

});
