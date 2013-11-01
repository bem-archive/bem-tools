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

    Node = require('./node').NodeName,

    LibraryNodeName = exports.LibraryNodeName = 'LibraryNode',

    SCM_VALIDITY_TIMEOUT = 60000; // 60 secs

/* jshint -W106 */
exports.__defineGetter__(LibraryNodeName, function() {
    return registry.getNodeClass(LibraryNodeName);
});
/* jshint +W106 */

registry.decl(LibraryNodeName, Node, /** @lends LibraryNode.prototype */ {

    nodeType: 2,

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
        this.npmPackages = o.npmPackages === undefined? ['package.json']: o.npmPackages;
    },

    /**
     * Get absolute path to library.
     *
     * @return {String}
     */
    getPath: function() {
        return PATH.resolve(this.root, this.target);
    },

    getLibraryContent: function() {
        // stub method
    },

    installLibraryDependencies: function() {

        if (this.npmPackages === false) {
            LOGGER.finfo('npmPackages config variable is set to false, skip installing npm dependencies for the %s library', this.target);
            return;
        }

        var _this = this;
        return Q.all(this.npmPackages
            .map(function(pkg) {

                pkg = PATH.join(this.getPath(), pkg);

                var opts = { cwd: PATH.dirname(pkg) },
                    npm = process.env.NPM || 'npm',
                    npmEnv = process.env.NPM_ENV || 'production';

                return QFS.exists(pkg)
                    .then(function(exists) {

                        if (!exists) {
                            LOGGER.finfo('%s file does not exist, skip installing npm dependencies for the %s library', pkg, _this.target);
                            return;
                        }

                        var cmd;

                        // simple update process
                        if (!_this.ctx.force) {
                            LOGGER.finfo('Installing dependencies for %s library (npm install)', _this.target);

                            cmd = npm + ' install --' + npmEnv;
                             _this.log(cmd);

                             return U.exec(cmd, opts);
                        }

                        LOGGER.finfo('Installing dependencies for %s library (npm prune && npm update)', _this.target);

                        cmd = npm + ' cache clean';
                        _this.log(cmd);

                        return U.exec(cmd, opts)
                            .then(function() {
                                var cmd = npm + ' prune';
                                _this.log(cmd);
                                return U.exec(cmd, opts);
                            })
                            .then(function() {
                                var cmd = npm + ' update';
                                _this.log(cmd);
                                return U.exec(cmd, opts);
                            });

                    });

            }, this));

    },

    make: function() {

        var _this = this;
        return U.mkdirp(PATH.dirname(this.getPath()))
            .fail(function() {

            })
            .then(function() {
                return Q.when(_this.getLibraryContent());
            })
            .then(function() {
                return _this.installLibraryDependencies();
            });
    }

}, {

    createId: function(o) {
        return o.target;
    }

});

var SymlinkLibraryNodeName = exports.SymlinkLibraryNodeName = 'SymlinkLibraryNode';

/* jshint -W106 */
exports.__defineGetter__(SymlinkLibraryNodeName, function() {
    return registry.getNodeClass(SymlinkLibraryNodeName);
});
/* jshint +W106 */

registry.decl(SymlinkLibraryNodeName, LibraryNodeName, /** @lends SymlinkLibraryNode.prototype */ {

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
    getLibraryContent: function() {

        var _this = this;
        return QFS.statLink(this.getPath())
            .fail(function() {
                return false;
            })
            .then(function(stat) {

                if (!stat) return;

                /* jshint -W109 */
                if (!stat.isSymbolicLink()) {
                    return Q.reject(UTIL.format("SymlinkLibraryNode: Path '%s' is exists and is not a symbolic link",
                        _this.getPath()));
                }
                /* jshint +W109 */

                return QFS.remove(_this.getPath());

            })
            .then(function() {

                var parent = PATH.dirname(_this.getPath());
                return QFS.exists(parent)
                    .then(function(exists) {

                        /* jshint -W109 */
                        if(!exists) {
                            LOGGER.verbose("SymlinkLibraryNode: Creating parent directory for target '%s'",
                                _this.getPath());
                            return QFS.makeTree(parent);
                        }
                        /* jshint +W109 */

                    });

            })
            .then(function() {
                return QFS.symbolicLink(_this.getPath(), _this.relative);
            });

    }

});

var ScmLibraryNodeName = exports.ScmLibraryNodeName = 'ScmLibraryNode';

/* jshint -W106 */
exports.__defineGetter__(ScmLibraryNodeName, function() {
    return registry.getNodeClass(ScmLibraryNodeName);
});
/* jshint +W106 */

registry.decl(ScmLibraryNodeName, LibraryNodeName, /** @lends ScmLibraryNode.prototype */ {

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

    /* jshint -W098 */
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
    /* jshint +W098 */

    /* jshint -W098 */
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
    /* jshint +W098 */

    /**
     * Checkout or update single repository path.
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
    getLibraryContent: function() {

        return Q.all(this.paths.map(function(path) {
            return this.updatePath(path);
        }, this));

    }

});

var GitLibraryNodeName = exports.GitLibraryNodeName = 'GitLibraryNode';

/* jshint -W106 */
exports.__defineGetter__(GitLibraryNodeName, function() {
    return registry.getNodeClass(GitLibraryNodeName);
});
/* jshint +W106 */

registry.decl(GitLibraryNodeName, ScmLibraryNodeName, /** @lends GitLibraryNode.prototype */ {

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
     * @param {String} [o.treeish]  Treeish (commit hash or tag) to checkout.
     * @param {String} [o.branch='master'] Branch to checkout.
     * @param {String} [o.origin='origin'] Remote name.
     */
    __constructor: function(o) {
        this.__base(o);
        this.treeish = o.treeish;
        this.branch = o.branch || 'master';
        this.origin = o.origin || 'origin';
    },

    getInitialCheckoutCmd: function(url, target) {
        return UTIL.format('git clone --progress --origin %s %s %s && cd %s && git checkout %s',
                this.origin, url, target, target, this.treeish || this.branch);
    },

    getUpdateCmd: function(url, target) {
        var onBranch = !this.treeish,
            gitDir = '--git-dir ' + PATH.join(target, '.git') + ' --work-tree ' + target;

        return UTIL.format('git %s fetch %s %s git %s checkout %s %s',
            gitDir,
            this.origin,
            onBranch? UTIL.format('&& git %s %s; ', gitDir, this.branch): ' && ',
            gitDir,
            this.treeish || this.branch,
            onBranch? UTIL.format('&& git %s rebase %s/%s', gitDir, this.origin, this.branch): '');
    },

    isValid: function() {

        var _this = this,
            path = PATH.resolve(this.root, this.target);

        return QFS.exists(path)
            .then(function(exists) {
                return exists && _this.getInfo(path)
                    .then(function(info) {
                        var head = info.HEAD,
                            wanted = _this.treeish || _this.branch;

                        LOGGER.verbose('HEAD is at ' + head + ' wanted is ' + wanted);

                        // head is at configured hash
                        if (wanted === head) return true;

                        var resolves = 'refs/heads/' + wanted;
                        if (info[resolves] !== head) resolves = 'refs/tags/' + wanted;
                        if (info[resolves] !== head) resolves = '';

                        if (resolves) LOGGER.fverbose('%s resolves to %s', head, resolves);
                        else LOGGER.fverbose('%s does not resolve to %s', head, wanted);

                        return !!resolves;
                    });
            });

    },

    getInfo: function(path) {

        var _this = this,
            cmd = UTIL.format('git --git-dir %s --work-tree %s show-ref --head', PATH.join(path, '.git'), path),
            d = Q.defer();

        this.log(cmd);

        CP.exec(cmd, function(err, stdout, stderr) {
            stderr && _this.log(stderr);

            if (err) return d.reject(err);

            d.resolve(_this._parseInfo(stdout));
        });

        return d.promise;
    },

    _parseInfo: function(stdout) {
        var refs = {};
        stdout.split('\n').forEach(function(line) {
            var ref = line.split(' ');
            refs[ref[1]] = ref[0];
        });

        return refs;
    }

});

var SvnLibraryNodeName = exports.SvnLibraryNodeName = 'SvnLibraryNode';

/* jshint -W106 */
exports.__defineGetter__(SvnLibraryNodeName, function() {
    return registry.getNodeClass(SvnLibraryNodeName);
});
/* jshint +W106 */

registry.decl(SvnLibraryNodeName, ScmLibraryNodeName, /** @lends SvnLibraryNode.prototype */ {

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
        return UTIL.format('svn co --non-interactive -q -r %s %s %s', this.revision, url, target);
    },

    getUpdateCmd: function(url, target) {
        return UTIL.format('svn up --non-interactive -q -r %s %s', this.revision, target);
    },

    getInfo: function(path) {

        var _this = this,
            cmd = UTIL.format('svn info --non-interactive %s', PATH.resolve(this.root, this.target, path)),
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
    p.pathname = PATH.joinPosix(p.pathname, part);
    return URL.format(p);
}
