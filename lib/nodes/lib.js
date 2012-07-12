var Q = require('q'),
    QFS = require('q-fs'),
    INHERIT = require('inherit'),
    CP = require('child_process'),
    PATH = require('path'),
    URL = require('url'),
    UTIL = require('util'),
    LOGGER = require('../logger'),

    Node = require('./node').Node,

    SCM_VALIDITY_TIMEOUT = 60000; // 60 secs

var LibraryNode = exports.LibraryNode = INHERIT(Node, /** @lends LibraryNode.prototype */ {

    /**
     * LibraryNode instance constructor.
     *
     * @class LibraryNode
     * @constructs
     * @param {Object} o  Node options.
     * @param {String} o.root    Project root path.
     * @param {String} o.target  Library path.
     */
    __constructor: function(o) {
        this.__base(o);
        this.root = o.root;
        this.target = o.target;
    },

    /**
     * Get absolute path to library.
     *
     * @return {String}
     */
    getPath: function() {
        return PATH.resolve(this.root, this.target);
    }

}, {

    createId: function(o) {
        return o.target;
    }

});

exports.SymlinkLibraryNode = INHERIT(LibraryNode, /** @lends SymlinkLibraryNode.prototype */ {

    /**
     * SymlinkLibraryNode instance constructor.
     *
     * @class SymlinkLibraryNode
     * @constructs
     * @param {Object} o  Node options.
     * @param {String} o.root      Project root path.
     * @param {String} o.target    Library path.
     * @param {String} o.relative  Symlink path.
     */
    __constructor: function(o) {
        this.__base(o);
        this.relative = o.relative;
    },

    /**
     * Check validity of node.
     *
     * @return {Boolean}
     */
    isValid: function() {
        return false;
    },

    /**
     * Make node.
     *
     * @return {Promise * Undefined}
     */
    make: function() {

        var _this = this;
        return QFS.statLink(this.getPath())
            .fail(function() {
                return false;
            })
            .then(function(stat) {

                if (!stat) return;

                if (!stat.isSymbolicLink()) {
                    return Q.reject(UTIL.format("SymlinkLibraryNode: Path '%s' is exists and is not a symbolic link",
                        _this.getPath()));
                }

                return QFS.remove(_this.getPath());

            })
            .then(function() {
                return QFS.symbolicLink(_this.getPath(), _this.relative);
            });

    }

});

var ScmLibraryNode = exports.ScmLibraryNode = INHERIT(LibraryNode, /** @lends ScmLibraryNode.prototype */ {

    /**
     * ScmLibraryNode instance constructor.
     *
     * @class ScmLibraryNode
     * @constructs
     * @param {Object} o  Node options.
     * @param {String} o.root      Project root path.
     * @param {String} o.target    Library path.
     * @param {String} o.url       Repository URL.
     * @param {String[]} [o.paths=['']]  Paths to checkout.
     */
    __constructor: function(o) {
        this.__base(o);
        this.url = o.url;
        this.paths = [''];
        this.timeout = typeof o.timeout !== 'undefined'? Number(o.timeout) : SCM_VALIDITY_TIMEOUT;
    },

    /**
     * Check validity of node.
     *
     * @return {Promise * Boolean}
     */
    isValid: function() {
        return Q.resolve(this.lastRunTime && this.timeout && (Date.now() - this.lastRunTime <= this.timeout));
    },

    /**
     * Stub for getInitialCheckoutCmd(), throws.
     *
     * @param {String} url  Repository url.
     * @param {String} target  Repository checkout path.
     * @throws {Error}
     */
    getInitialCheckoutCmd: function(url, target) {
        throw new Error('getInitialCheckoutCmd() not implemented!');
    },

    /**
     * Stub for getUpdateCmd(), throws.
     *
     * @param {String} url  Repository url.
     * @param {String} target  Repository checkout path.
     * @throws {Error}
     */
    getUpdateCmd: function(url, target) {
        throw new Error('getInitialCheckoutCmd() not implemented!');
    },

    /**
     * Checkput or update single repository path.
     *
     * @param {String} path  Repository path to checkout / update.
     * @return {Promise * Undefined}
     */
    updatePath: function(path) {

        var _this = this,
            target = PATH.resolve(this.root, this.target, path),
            repo = joinUrlPath(this.url, path);

        return QFS.exists(target)
            .then(function(exists) {

                var cmd = exists?
                        _this.getUpdateCmd(repo, target) :
                        _this.getInitialCheckoutCmd(repo, target),
                    d = Q.defer();

                _this.log(cmd);

                CP.exec(cmd, function(err, stdout, stderr) {
                    stdout && _this.log(stdout);
                    stderr && _this.log(stderr);

                    if (err) return d.reject(err);

                    _this.lastRunTime = Date.now();
                    d.resolve();
                });

                return d.promise;

            });

    },

    /**
     * Make node.
     *
     * @return {Promise * Undefined}
     */
    make: function() {

        return Q.all(this.paths.map(function(path) {
            return this.updatePath(path);
        }, this));

    }

});

exports.GitLibraryNode = INHERIT(ScmLibraryNode, /** @lends GitLibraryNode.prototype */ {

    /**
     * GitLibraryNode instance constructor.
     *
     * @class GitLibraryNode
     * @constructs
     * @param {Object} o  Node options.
     * @param {String} o.root      Project root path.
     * @param {String} o.target    Library path.
     * @param {String} o.url       Repository URL.
     * @param {String[]} [o.paths=['']]  Paths to checkout.
     * @param {String} [o.treeish='master']  Treeish to checkout.
     */
    __constructor: function(o) {
        this.__base(o);
        this.treeish = o.treeish || 'master';
    },

    getInitialCheckoutCmd: function(url, target) {
        return UTIL.format('git clone --progress %s %s && cd %s && git checkout %s', url, target, target, this.treeish);
    },

    getUpdateCmd: function(url, target) {
        return UTIL.format('cd %s && git checkout HEAD~ && git branch -D %s ; git fetch origin && git checkout --track -b %s origin/%s', target, this.treeish, this.treeish, this.treeish);
    }

});

exports.SvnLibraryNode = INHERIT(ScmLibraryNode, /** @lends SvnLibraryNode.prototype */ {

    /**
     * SvnLibraryNode instance constructor.
     *
     * @class SvnLibraryNode
     * @constructs
     * @param {Object} o  Node options.
     * @param {String} o.root      Project root path.
     * @param {String} o.target    Library path.
     * @param {String} o.url       Repository URL.
     * @param {String[]} [o.paths=['']]  Paths to checkout.
     * @param {String} [o.revision='HEAD']  Revision to checkout.
     */
    __constructor: function(o) {
        this.__base(o);
        this.paths = Array.isArray(o.paths)? o.paths : [o.paths || ''];
        this.revision = o.revision || 'HEAD';
    },

    /**
     * Check validity of node.
     *
     * Use output of `svn info` to check revision property.
     * If revision is the same as in config on all paths then
     * return promised true.
     *
     * @return {Promise * Boolean}
     */
    isValid: function() {

        var _this = this,
            base = this.__base();

        if (this.revision === 'HEAD') return base;

        return Q.all(this.paths.map(function(path) {
                return QFS.exists(PATH.resolve(_this.root, _this.target, path))
                    .then(function(exists) {
                        return exists && _this.getInfo(path)
                            .then(function(info) {
                                return String(info.revision) === String(_this.revision);
                            });
                });

            }))
            .then(function(checks) {

                return checks.reduce(function(cur, prev) {
                    return cur && prev;
                }, true) || base;

            });

    },

    getInitialCheckoutCmd: function(url, target) {
        return UTIL.format('svn co -q -r %s %s %s', this.revision, url, target);
    },

    getUpdateCmd: function(url, target) {
        return UTIL.format('svn up -q -r %s %s', this.revision, target);
    },

    getInfo: function(path) {

        var _this = this,
            cmd = UTIL.format('svn info %s', PATH.resolve(this.root, this.target, path)),
            d = Q.defer();

        this.log(cmd);

        CP.exec(cmd, function(err, stdout, stderr) {
            stdout && _this.log(stdout);
            stderr && _this.log(stderr);

            if (err) return d.reject(err);

            d.resolve(_this._parseInfo(stdout));
        });

        return d.promise;

    },

    _parseInfo: function(text) {

        var sep = ': ',
            info = {};

        text.split('\n').forEach(function(line) {

            if (!line) return;

            var i = line.indexOf(sep),
                key = line.substr(0, i).toLowerCase().replace(/\s+/, '-').replace(/^\s+|\s+$/, '');

            info[key] = line.substr(i + sep.length).replace(/^\s+|\s+$/, '');

        });

        return info;

    }

});

function joinUrlPath(url, part) {
    var p = URL.parse(url);
    p.pathname = PATH.join(p.pathname, part);
    return URL.format(p);
}
