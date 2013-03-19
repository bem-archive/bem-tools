var INHERIT = require('inherit'),
    Q = require('q'),
    QFS = require('q-fs'),
    PATH = require('../path'),
    CP = require('child_process'),
    BEM = require('../coa').api,
    createLevel = require('../level').createLevel,
    LOGGER = require('../logger'),
    U = require('../util'),
    registry = require('../nodesregistry'),

    GeneratedFileNode = require('./file').GeneratedFileNodeName,

    BemCreateNodeName = exports.BemCreateNodeName = 'BemCreateNode';

exports.__defineGetter__(BemCreateNodeName, function() {
    return registry.getNodeClass(BemCreateNodeName);
});

registry.decl(BemCreateNodeName, GeneratedFileNode, {

    nodeType: 5,

    __constructor: function(o) {

        this.level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level)) :
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

        worker.on('exit', function(code) {
            LOGGER.fdebug("Exit of bemcreate worker for node '%s' with code %s", _this.output, code);
            handler({ code: code });
        });

        worker.on('message', function(m) {
            LOGGER.fdebug("Message from bemcreate worker for node '%s': %j", _this.output, m);
            handler(m);
        });

        worker.send(p);

        return d.promise;
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
        return Q.all(this.tech
            .getPaths(PATH.resolve(this.root, this.getNodePrefix()), this.tech.getCreateSuffixes())
            .map(function(path) {

                return QFS.remove(path)
                    .then(function() {
                        LOGGER.fverbose('[-] Removed %j', path);
                    })
                    .fail(function() {});

            }))
            .then(function() {

                return U.removePath(_this.getPath())
                    .then(function() {
                        LOGGER.fverbose('[-] Removed %j', _this.getId());
                    })
                    .fail(function() {});

            });

    },

    getFiles: function() {
        return this.tech.getPaths(this.getNodePrefix(), this.tech.getCreateSuffixes());
    },

    getDependencies: function() {

        return this.tech.getDependencies().map(function(d) {
            return this.level.getPath(this.getNodePrefix(), d);
        }, this);

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
