'use strict';

var Q = require('q'),
    QFS = require('q-io/fs'),
    CP = require('child_process'),
    PATH = require('../path'),
    URL = require('url'),
    UTIL = require('util'),
    U = require('../util'),
    LOGGER = require('../logger'),
    registry = require('../nodesregistry'),
    bowerNpmInstall = require('bower-npm-install/lib/coa'),

    Node = require('./node').NodeName,

    VALIDITY_TIMEOUT = 60000; // 60 secs

var BowerNpmInstallNodeName = exports.BowerNpmInstallNodeName = 'BowerNpmInstallNode';

/* jshint -W106 */
exports.__defineGetter__(BowerNpmInstallNodeName, function() {
    return registry.getNodeClass(BowerNpmInstallNodeName);
});
/* jshint +W106 */

registry.decl(BowerNpmInstallNodeName, Node, /** @lends BowerNpmInstallNode.prototype */ {

    /**
     * BowerNpmInstallNode instance constructor.
     *
     * @class BowerNpmInstallNode
     * @constructs
     * @param {Object} o  Node options.
     * @param {String} o.root      Project root path.
     */
    __constructor: function(o) {
        this.root = o.root;
        this.timeout = typeof o.timeout !== 'undefined'? Number(o.timeout) : VALIDITY_TIMEOUT;
        this.__base(o);
    },

    /**
     * Check validity of node.
     *
     * @return {Boolean}
     */
    isValid: function() {
        return Q.resolve(this.lastRunTime && this.timeout && (Date.now() - this.lastRunTime <= this.timeout));
    },


    make: function() {
        var _this = this;

        LOGGER.silly('checking for %s', PATH.join(this.root, 'bower.json'));
        return QFS.isFile(PATH.join(this.root, 'bower.json'))
            .then(function(isFile) {
                if (!isFile) {
                    LOGGER.silly('bower.json does not exists, skipping');
                    return;
                }

                LOGGER.silly('bower.json exists, going to run bower-npm-install');

                return bowerNpmInstall
                    .api(null, null, {
                        project: _this.root
                    })
                    .then(function() {
                        _this.lastRunTime = Date.now();
                    });
            });
    }
}, {

    createId: function(o) {
        return o.id;
    }
});


function joinUrlPath(url, part) {
    var p = URL.parse(url);
    p.pathname = PATH.joinPosix(p.pathname, part);
    return URL.format(p);
}
