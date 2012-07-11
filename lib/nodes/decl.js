var INHERIT = require('inherit'),
    PATH = require('path'),
    BEM = require('../coa').api,
    createLevel = require('../level').createLevel,
    U = require('../util'),
    registry = require('../nodesregistry').NodesRegistry,

    GeneratedFileNode = require('./file').GeneratedFileNodeName,

    BemDeclNodeName = exports.BemDeclNodeName = 'BemDeclNode';

exports.__defineGetter__(BemDeclNodeName, function() {
    return registry.getNodeClass(BemDeclNodeName);
});

registry.decl(BemDeclNodeName, GeneratedFileNode, {

    __constructor: function(o) {

        this.level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level)) :
            o.level;
        this.item = o.item;
        this.decls = o.decls;
        this.cmd = o.cmd;
        this.force = !!o.force || false;

        this.__base(U.extend({ path: this.__self.createPath(o) }, o));
    },

    make: function() {
        this.log('bem.decl.%s(%s)', this.cmd, JSON.stringify(this.decls));

        return BEM.decl[this.cmd]({
            output: this.getPath(),
            declaration: this.decls.map(function(d) {
                return PATH.resolve(this.root, d)
            }, this)
        });
    },

    getNodePrefix: function(o) {

        if (!this._nodePrefix) {
            this._nodePrefix = this.__self.createNodePrefix(o || {
                root: this.root,
                level: this.level,
                item: this.item
            });
        }
        return this._nodePrefix;

    },

    getDependencies: function() {

        return this.decls;
    }

}, {

    createId: function(o) {
        return this.createPath(o);
    },

    createPath: function(o) {

        var level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level)) :
            o.level;

        return level
            .getTech(o.techName, o.techPath)
            .getPath(this.createNodePrefix(U.extend({}, o, { level: level })));

    },

    createNodePrefix: function(o) {

        var level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level)) :
            o.level;

        return PATH.relative(o.root, level.getByObj(o.item));

    }

});
