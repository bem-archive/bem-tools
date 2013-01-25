var INHERIT = require('inherit'),
    Q = require('q'),
    QFS = require('q-fs'),
    PATH = require('../path'),
    BEM = require('../coa').api,
    createLevel = require('../level').createLevel,
    LOGGER = require('../logger'),
    U = require('../util'),
    registry = require('../nodesregistry'),

    EntityNode = require('./entity').EntityNodeName,

    BemCreateNodeName = exports.BemCreateNodeName = 'BemCreateNode';

exports.__defineGetter__(BemCreateNodeName, function() {
    return registry.getNodeClass(BemCreateNodeName);
});

registry.decl(BemCreateNodeName, EntityNode, {

    nodeType: 5,

    __constructor: function(o) {

        this.level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level)) :
            o.level;
        this.item = o.item;
        this.tech = this.level.getTech(o.techName, o.techPath);
        this.force = !!o.force || false;

        this.__base(U.extend({ path: this.__self.createPath(o) }, o));

    },

    make: function() {
        var p = this.parseItem(this.item);
        p.opts.force = this.force;
        p.opts.level = this.level.dir;
        p.opts.forceTech = this.tech.getTechPath();

        this.log('bem.create.%s(%s, %s)', p.cmd, JSON.stringify(p.opts, null, 4), JSON.stringify(p.args, null, 4));

        return BEM.create[p.cmd](p.opts, p.args);
    },

    parseItem: function(item) {
        var cmd = 'block',
            opts = {},
            args = { names: item.block };
        if (item.mod) {
            cmd = 'mod';
            opts.blockName = item.block;
            args.names = item.mod;
            item.elem && (opts.elemName = item.elem);
            item.val && (opts.modVal = item.val);
        } else if (item.elem) {
            cmd = 'elem';
            opts.blockName = item.block;
            args.names = item.elem;
        }

        return {
            cmd: cmd,
            opts: opts,
            args: args
        };
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
    },

    getFiles: function() {
        return this.rootLevel.resolveBemPath(this.resolved, this.tech.getCreateSuffixes());
    },

    getDependencies: function() {
        var resolved = this.resolved.concat([]);

        return this.tech.getDependencies().map(function(d) {
            resolved[resolved.length-1] = U.extend({}, this.item, {tech: d})
            return U.serializeBemPath(resolved);
        }, this);

    }

}, {

    createPath: function(o) {

        var level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level)) :
            o.level;

        return level
            .getTech(o.techName, o.techPath)
            .getPath(this.createNodePrefix(U.extend({}, o, { level: level })));

    }

});
