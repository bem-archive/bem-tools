'use strict';

var Q = require('q'),
    QFS = require('q-io/fs'),
    INHERIT = require('inherit'),
    APW = require('apw'),
    PATH = require('./path'),
    UTIL = require('util'),
    REGISTRY = require('./nodesregistry'),
    LOGGER = require('./logger');

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
            if (exists) return loadConfig(rootMakefile);

        })
        .then(function() {
            return new (DefaultArch.Arch)(arch, opts).alterArch();
        });

};

function loadConfig(path) {
    var rs = require(path);

    if (typeof rs === 'function') {
        rs(REGISTRY);
        LOGGER.fsilly("Configuration file '%s' just applied", path);
    }
    else LOGGER.ferror('File %s doesn\'t seem to be a valid configuration file', path);
}
