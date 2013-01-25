var VM = require('vm'),
    Q = require('q'),
    QFS = require('q-fs'),
    INHERIT = require('inherit'),
    APW = require('apw'),
    PATH = require('./path'),
    UTIL = require('util'),
    U = require('./util'),
    REGISTRY = require('./nodesregistry'),
    createLevel = require('./level').createLevel,
    LOGGER = require('./logger');

exports.DEFAULT_WORKERS = 10;

exports.APW = INHERIT(APW, {

    __constructor: function(arch, workers, opts) {
        this.__base.apply(this, arguments);
        this.root = opts.root;
    },

    findAndProcess: function(targets) {
        if (!Array.isArray(targets)) targets = [targets];

        // Convert targets into unified form or leave as is when particular target failed to convert
        targets = targets.map(function(t) {
            return this.anyToUnified(t) || t;
        }, this);

        var _this = this,

        // FIXME: hack to make possible specify borschik files as targets (pages/index/_index.css)
            foundNodes = targets.map(function(t) {
                if (t.match(/\/_[^\/]+$/))
                    t = this.anyToUnified(t.replace(/(\/_)([^\/]+)$/, '/$2'))
                        .replace(/\.\w+$/, '');

                return _this.findNode(t);
            }, this);

        return Q.all(foundNodes)
            .then(function() {
                return _this.process(targets);
            });
    },

    // TODO: move node introspection logic to the node in arch
    findNode: function(id, head, tail) {

        head = head || '';
        tail = tail || id;

        if (this.arch.hasNode(id)) return Q.resolve(id);
        if (head == id) return Q.reject(UTIL.format('Node "%s" not found', id));

        var col = tail.indexOf(':', 1),
            dot = tail.indexOf('.', 1),
            pos = Math.min(col, dot);

        if (pos === -1) pos = Math.max(col, dot);

        var p = pos === -1? tail: tail.substring(0, pos);

        tail = tail.substring(p.length);
        head = (head || '') + p;

        var _this = this,
            magicHead = head + '*';

        if (!this.arch.hasNode(magicHead)) {
            return this.findNode(id, head, tail);
        }

        return this.process(magicHead).then(function() {
            return _this.findNode(id, head, tail);
        });
    },

    anyToUnified: function(id) {
        var resolved = createLevel(this.root).matchPath(id) || U.deserializeBemPath(id),
            serialized = U.serializeBemPath(resolved);

        return serialized;
    }

}, {

    Workers: INHERIT(APW.Workers, {

        start: function(plan) {
            LOGGER.finfo("[i] Going to build '%s' [%s]", plan.getTargets().join("', '"), plan.getId());
            return this.__base(plan);
        }

    })

});

exports.createArch = function(opts) {

    var arch = new APW.Arch(opts),
        DefaultArch = require('./default-arch'),
        rootMakefile = PATH.join(opts.root, '.bem', 'make.js');

    return QFS.exists(rootMakefile)
        .then(function(exists) {

            LOGGER.fsilly("File '%s' %s", rootMakefile, exists? 'exists' : "doesn't exist");
            if (exists) return include(rootMakefile);

        })
        .then(function() {
            return new (DefaultArch.Arch)(arch, opts).alterArch();
        });

};

function getIncludeFunc(resolvePath) {

    return function(path) {
        return include(resolvePath(path));
    }

}

function include(path) {
    return evalConfig(require('fs').readFileSync(path, 'utf8'), path);
}

function evalConfig(content, path) {

    LOGGER.fsilly("File '%s' read, evaling", path);

    var requireFunc = U.getRequireFunc(path);

    VM.runInNewContext(
        content,
        U.extend({}, global, {
            MAKE: REGISTRY,
            module: null,
            __filename: path,
            __dirname: PATH.dirname(path),
            require: requireFunc,
            include: getIncludeFunc(requireFunc.resolve)
        }),
        path);

    LOGGER.fsilly("File '%s' evaled", path);

}
