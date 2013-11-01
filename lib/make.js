'use strict';

var VM = require('vm'),
    Q = require('q'),
    QFS = require('q-io/fs'),
    INHERIT = require('inherit'),
    APW = require('apw'),
    PATH = require('./path'),
    UTIL = require('util'),
    BEMUTIL = require('./util'),
    REGISTRY = require('./nodesregistry'),
    LOGGER = require('./logger'),
    reqf = require('reqf');

exports.DEFAULT_WORKERS = 10;

exports.APW = INHERIT(APW, {

    findAndProcess: function(targets) {
        if (!Array.isArray(targets)) targets = [targets];

        // Strip trailing slashes from target names
        // See https://github.com/bem/bem-tools/issues/252
        var re = new RegExp(PATH.dirSep + '$');
        targets = targets.map(function(t) {
            return t.replace(re, '');
        });

        var _this = this,
            foundNodes = targets.map(function(t) {
                return _this.findNode(t);
            });
        return Q.all(foundNodes)
            .fail(function(err) {
                if (typeof err === 'string') return;
                return Q.reject(err);
            })
            .then(function() {
                return _this.process(targets);
            });
    },

    // TODO: move node introspection logic to the node in arch
    findNode: function(id, head, tail) {
        head = head || '';
        tail = tail || id;

        if (this.arch.hasNode(id)) return Q.resolve(id);
        if (head === id) return Q.reject(UTIL.format('Node "%s" not found', id));

        var parts = tail.split(PATH.dirSep),
            p = parts.shift();
        head = (head? [head, p] : [p]).join(PATH.dirSep);
        tail = parts.join(PATH.dirSep);

        var _this = this,
            magicHead = head + '*';
        if (!this.arch.hasNode(magicHead)) {
            return this.findNode(id, head, tail);
        }

        return this.process(magicHead).then(function() {
            return _this.findNode(id, head, tail);
        });
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

    var arch = new APW.Arch(),
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
    };

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

    var resolvePath = getPathResolver(path);

    VM.runInNewContext(
        content,
        BEMUTIL.extend({}, global, {
            MAKE: REGISTRY,
            module: null,
            __filename: path,
            __dirname: PATH.dirname(path),
            require: reqf(path, module),
            include: getIncludeFunc(resolvePath)
        }),
        path);

    LOGGER.fsilly("File '%s' evaled", path);
    /* jshint +W109 */

}
