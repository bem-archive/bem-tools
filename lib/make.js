'use strict';

var VM = require('vm'),
    Q = require('q'),
    QFS = require('q-fs'),
    INHERIT = require('inherit'),
    APW = require('apw'),
    PATH = require('./path'),
    UTIL = require('util'),
    U = require('./util'),

    TargetNode = require('./nodes/target'),
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
            re = new RegExp(PATH.dirSep + '$'),
            foundNodes = targets.map(function(t) {
                return _this.createTargetNode(t.replace(re, ''));
            }, this);

        return Q.all(foundNodes)
            .then(function() {
                return _this.process(foundNodes);
            });
    },

    createTargetNode: function(id) {
        if (this.arch.hasNode(id)) return Q.resolve(id);

        var arch = this.arch;

        id = this.anyToUnified(id) || id;

        if (this.arch.hasNode(id)) return Q.resolve(id);

        var targetId = '=' + id,
            children = [];

        // hack to handle borschik files as targets
        if (id.match(/\/_[^\/]+$/)) {
            children.push(id);
            id = this.anyToUnified(id.replace(/(\/_)([^\/]+)$/, '/$2'))
                .replace(/\.\w+$/, '');
        } else if (~id.indexOf(PATH.dirSep)) {
            id = id.replace('/', ':');
            targetId = '=' + id;
        }

        var target = new TargetNode.TargetNode(targetId);

        LOGGER.fdebug('created target node %s', targetId);
        arch.setNode(target)
            .addChildren(targetId, "build*", true)
            .addChildren(targetId, id, true);

        LOGGER.fdebug('linked %s with build*, %s', targetId, id);

        var parts = id.split(':'),
            c = '';


        parts.forEach(function(part) {
            var name = part.split('.', 1)[0],
                tech = part.substr(name.length);

            c += name;
            children.push(c);
            if (tech) {
                c += tech;
                children.push(c);
            }

            c += ':';
        });

        arch.addChildren(target, children, true);
        LOGGER.fdebug('linked %s with %j', targetId, children);
        return targetId;
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
