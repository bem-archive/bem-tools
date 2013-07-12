'use strict';

var VM = require('vm'),
    Q = require('q'),
    QFS = require('q-fs'),
    INHERIT = require('inherit'),
    APW = require('apw'),
    PATH = require('./path'),
    UTIL = require('util'),
    U = require('./util'),

    Node = require('./nodes/node').NodeName,
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

        var _this = this,

            foundNodes = targets.map(function(t) {
                return _this.createTargetNode(t);
            }, this);

        return Q.all(foundNodes)
            .then(function() {
                return _this.process(foundNodes);
            });
    },

    createTargetNode: function(id) {
        if (this.arch.hasNode(id)) return Q.resolve(id);

        var arch = this.arch,
            target = new (REGISTRY.getNodeClass(Node))('=' + id),
            targetId = target.getId();

        id = this.anyToUnified(id) || id;

        if (this.arch.hasNode(id)) return Q.resolve(id);

        if (id.match(/\/_[^\/]+$/))
            id = this.anyToUnified(id.replace(/(\/_)([^\/]+)$/, '/$2'))
                .replace(/\.\w+$/, '');

        LOGGER.fdebug('created target node %s', targetId);
        arch.setNode(target)
            .addChildren(targetId, "build*", true)
            .addChildren(targetId, id, true);

        LOGGER.fdebug('linked %s with build*, %s', targetId, id);

        var parts = id.split(':'),
            c = '',
            children = [];

        parts.forEach(function(part) {
            var name = part.split('.', 1)[0],
                tech = part.substr(name.length);

            c += name;
            c !== 'desktop' && children.push(c + '*');
            if (tech) {
                c += tech;
                c !== 'desktop.bundles:example.css' && children.push(c + '*');
            }

            c += ':';
        });

        arch.addChildren(target, children, true);
        LOGGER.fdebug('linked %s with %j', targetId, children);
        return targetId;
    },

    // TODO: move node introspection logic to the node in arch
    findNode: function(id, head, tail) {

        head = head || '';
        tail = tail || id;

        if (this.arch.hasNode(id)) return Q.resolve(id);
        if (head === id) return Q.reject(UTIL.format('Node "%s" not found', id));

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
            /* jshint -W109 */
            LOGGER.finfo("[i] Going to build '%s' [%s]", plan.getTargets().join("', '"), plan.getId());
            /* jshint +W109 */
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

            /* jshint -W109 */
            LOGGER.fsilly("File '%s' %s", rootMakefile, exists? 'exists' : "doesn't exist");
            /* jshint +W109 */
            if (exists) return include(rootMakefile);

        })
        .then(function() {
            return new (DefaultArch.Arch)(arch, opts).alterArch();
        });

};

function getPathResolver(base) {

    return function(path) {
        return path.match(/^\./)? PATH.resolve(PATH.dirname(base), path) : path;
    }

}

function getRequireFunc(resolvePath) {

    return function(path) {
        return require(resolvePath(path));
    }

}

function getIncludeFunc(resolvePath) {

    return function(path) {
        return include(resolvePath(path));
    };

}

function include(path) {
    return evalConfig(require('fs').readFileSync(path, 'utf8'), path);
}

function evalConfig(content, path) {

    /* jshint -W109 */
    LOGGER.fsilly("File '%s' read, evaling", path);

    var resolvePath = getPathResolver(path),
        requireFunc = getRequireFunc(resolvePath);

    // let require.resolve() to work in make.js modules
    requireFunc.resolve = resolvePath;

    VM.runInNewContext(
        content,
        U.extend({}, global, {
            MAKE: REGISTRY,
            module: null,
            __filename: path,
            __dirname: PATH.dirname(path),
            require: requireFunc,
            include: getIncludeFunc(resolvePath)
        }),
        path);

    LOGGER.fsilly("File '%s' evaled", path);
    /* jshint +W109 */

}
