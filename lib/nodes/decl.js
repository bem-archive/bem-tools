'use strict';

var Q = require('q'),
    QFS = require('q-fs'),
    PATH = require('../path'),
    _ = require('underscore'),
    BEM = require('../coa').api,
    createLevel = require('../level').createLevel,
    LOGGER = require('../logger'),
    U = require('../util'),
    registry = require('../nodesregistry'),

    EntityNode = require('./entity').EntityNodeName,

    BemDeclNodeName = exports.BemDeclNodeName = 'BemDeclNode';

/* jshint -W106 */
exports.__defineGetter__(BemDeclNodeName, function() {
    return registry.getNodeClass(BemDeclNodeName);
});
/* jshint +W106 */

registry.decl(BemDeclNodeName, EntityNode, {

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

        this.__base(o);
    },

    /**
     * Runs 'bem decl [cmd] [decls]'
     */
    make: function() {
        if (!this.decls || !this.decls.length) {
            this.log('Declarations list is empty. Skipping operation.');
            return;
        }

        this.log('bem.decl.%s(%s)', this.cmd, JSON.stringify(this.decls));

        return BEM.decl[this.cmd]({
            output: this.getPaths()[0],
            declaration: _.flatten(this.decls.map(function(d) {
                return this.rootLevel.resolveBemPath(U.deserializeBemPath(d));
            }, this))
        });
    },

    /**
     * Returns node dependencies. The list is equal to the dependencies specified in the constructor.
     * @return {String[]}
     */
    getDependencies: function() {

        return this.decls;
    },

    /**
     * clean() implementation.
     * @return {Promise * Undefined}
     */
    clean: function() {

        var _this = this;
        return Q.all(this.getPaths()
            .map(function(path) {
                return QFS.remove(path)
                    .then(function() {
                        LOGGER.fverbose('[-] Removed %j', path);
                    })
                    .fail(function() {});

            }));
    }

}, {

    createPath: function(o) {

        var level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level), {
                projectRoot: o.root
            }) :
            o.level;

        return level
            .getTech(o.techName, o.techPath)
            .getPath(this.createNodePrefix(U.extend({}, o, { level: level })));

    }
});
