'use strict';

var Q = require('q'),
    QFS = require('q-fs'),
    PATH = require('../path'),
    CP = require('child_process'),
    BEM = require('../coa').api,
    createLevel = require('../level').createLevel,
    LOGGER = require('../logger'),
    U = require('../util'),
    registry = require('../nodesregistry'),

    EntityNode = require('./entity').EntityNodeName,

    BemCreateNodeName = exports.BemCreateNodeName = 'BemCreateNode';

/* jshint -W106 */
exports.__defineGetter__(BemCreateNodeName, function() {
    return registry.getNodeClass(BemCreateNodeName);
});
/* jshint +W106 */

registry.decl(BemCreateNodeName, EntityNode, {

    nodeType: 5,

    __constructor: function(o) {

        this.level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level), {
                projectRoot: o.root
            }) :
            o.level;
        this.item = o.item;
        this.tech = this.level.getTech(o.techName, o.techPath);
        this.force = !!o.force || false;
        this.forked = typeof o.forked === 'undefined'? false : !!o.forked;

        this.__base(U.extend({ path: this.__self.createPath(o) }, o));

    },

    make: function() {
        var p = this.parseItem(this.item);
        p.opts.force = this.force;
        p.opts.root = this.root;
        p.opts.level = this.level.dir;
        p.opts.forceTech = this.tech.getTechPath();

        this.log('bem.create.%s(forked=%j, %s, %s)',
            p.cmd,
            this.forked,
            JSON.stringify(p.opts, null, 4),
            JSON.stringify(p.args, null, 4));

        if (!this.forked) {
            return BEM.create[p.cmd](p.opts, p.args);
        }

        // TODO: generalize forking of bem commands
        var _this = this,
            d = Q.defer(),
            worker = CP.fork(PATH.join(__dirname, 'workers', 'bemcreate.js'), null, { env: process.env }),
            handler = function(m) {
                (m.code !== 0)? d.reject(m.msg) : d.resolve();
            };

        /* jshint -W109 */
        worker.on('exit', function(code) {
            LOGGER.fdebug("Exit of bemcreate worker for node '%s' with code %s", _this.output, code);
            handler({ code: code });
        });

        worker.on('message', function(m) {
            LOGGER.fdebug("Message from bemcreate worker for node '%s': %j", _this.output, m);
            handler(m);
        });
        /* jshint +W109 */

        worker.send(p);

        return d.promise;
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
            createLevel(PATH.resolve(o.root, o.level), {
                projectRoot: o.root
            }) :
            o.level;

        return level
            .getTech(o.techName, o.techPath)
            .getPath(this.createNodePrefix(U.extend({}, o, { level: level })));

    }

});
