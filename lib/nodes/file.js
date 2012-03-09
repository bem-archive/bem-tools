var Q = require('q'),
    QFS = require('q-fs'),
    INHERIT = require('inherit'),
    UTIL = require('util'),

    Node = require('./node').Node;

var FileNode = exports.FileNode = INHERIT(Node, {

    __constructor: function(path, optional) {
        this.path = path;
        this.optional = optional || false;
        this.__base(path);
    },

    make: function() {
        if (this.optional) return;

        var _this = this;
        return QFS.exists(this.getId()).then(function(exists) {
            if (!exists) return Q.reject(UTIL.format("Path %j doesn't exist", _this.getId()));
        });
    },

    isValid: function(ctx) {
        if (ctx.method && ctx.method != 'make') return false;
        if (ctx.force) return false;

        var parent = this.lastModified(),
            children = ctx.arch.children[this.getId()]
                .filter(function(child) {
                    return (child && (ctx.arch.getNode(child).node) instanceof FileNode);
                })
                .map(function(child) {
                    return ctx.arch.getNode(child).node.lastModified();
                });

        // with no deps we must always check for file existance
        // isValid() == false will guarantee it
        if (!children.length) return false;

        //var _this = this;
        return Q.all([parent].concat(children)).then(function(all) {
            var cur = all.shift(),
                max = Math.max.apply(Math, all);

            //console.log('*** isValid(%s): cur=%s, max=%s, valid=%s', _this.getId(), cur, max, cur >= max && max > -1);
            return cur >= max && max > -1;
        });
    },

    lastModified: function() {
        return QFS.lastModified(this.path).fail(function(err) {
            return -1;
        });
    }

});

exports.GeneratedFileNode = INHERIT(FileNode, {

    make: function() {},

    clean: function() {
        var _this = this;
        return QFS.remove(this.getId())
            .then(function() {
                console.log('Removed %j', _this.getId());
            })
            .fail(function() {});
    }

});
