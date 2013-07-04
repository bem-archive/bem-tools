'use strict';

var PATH = require('../path'),
    BEM = require('../coa').api,
    createLevel = require('../level').createLevel,
    U = require('../util'),
    registry = require('../nodesregistry'),

    GeneratedFileNode = require('./file').GeneratedFileNodeName,

    BemDeclNodeName = exports.BemDeclNodeName = 'BemDeclNode';

/* jshint -W106 */
exports.__defineGetter__(BemDeclNodeName, function() {
    return registry.getNodeClass(BemDeclNodeName);
});
/* jshint +W106 */

registry.decl(BemDeclNodeName, GeneratedFileNode, {

    __constructor: function(o) {

        this.level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level), {
                projectRoot: o.root
            }) :
            o.level;
        this.item = o.item;
        this.decls = o.decls;
        this.cmd = o.cmd;
        this.force = !!o.force || false;

        this.__base(U.extend({ path: this.__self.createPath(o) }, o));
    },

    /**
     * Runs 'bem decl [cmd] [decls]'
     */
    make: function() {
        this.log('bem.decl.%s(%s)', this.cmd, JSON.stringify(this.decls));

        return BEM.decl[this.cmd]({
            output: this.getPath(),
            declaration: this.decls.map(function(d) {
                return PATH.resolve(this.root, d);
            }, this)
        });
    },

    /**
     * Builds node prefix path
     * @param [o] Options
     * @param o.root Project root
     * @param o.level Level
     * @param o.item Item
     * @return {String}
     */
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

    /**
     * Returns node dependencies. The list is equal to the dependencies specified in the constructor.
     * @return {String[]}
     */
    getDependencies: function() {

        return this.decls;
    }

}, {

    createId: function(o) {
        return this.createPath(o);
    },

    createPath: function(o) {

        var level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level), {
                projectRoot: o.root
            }) :
            o.level;

        return level
            .getTech(o.techName, o.techPath)
            .getPath(this.createNodePrefix(U.extend({}, o, { level: level })));

    },

    createNodePrefix: function(o) {

        var level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level), {
                projectRoot: o.root
            }) :
            o.level;

        return PATH.relative(o.root, level.getByObj(o.item));

    }

});
