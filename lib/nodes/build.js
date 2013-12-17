'use strict';

var _ = require('lodash/dist/lodash.underscore'),
    Q = require('q'),
    QFS = require('q-io/fs'),
    FS = require('fs'),
    PATH = require('../path'),
    CP = require('child_process'),
    VM = require('vm'),
    LOGGER = require('../logger'),
    BEM = require('../coa').api,
    createLevel = require('../level').createLevel,
    Context = require('../context').Context,
    U = require('../util'),
    registry = require('../nodesregistry'),

    FileNode = require('./file'),
    GeneratedFileNode = require('./file').GeneratedFileNodeName,

    BemBuildNodeName = exports.BemBuildNodeName = 'BemBuildNode';

/* jshint -W106 */
exports.__defineGetter__(BemBuildNodeName, function() {
    return registry.getNodeClass(BemBuildNodeName);
});
/* jshint +W106 */

registry.decl(BemBuildNodeName, GeneratedFileNode, {

    nodeType: 7,

    __constructor: function(o) {

        this.bundlesLevel = o.bundlesLevel;
        this.levelsPaths = o.levels.map(function(level) {
            return level.path || level;
        });
        this.levels = o.levels.map(function(l) {
            return createLevel(l, {
                projectRoot: o.root
            });
        });
        this.declPath = o.declPath;
        this.techName = o.techName;
        this.output = o.output;
        this.forked = typeof o.forked === 'undefined'? false : !!o.forked;

        // NOTE: Every time we need new tech object so we use createTech().
        // If we use getTech(), we'll overwrite context of the same tech
        // object that is prone to collisions
        this.tech = this.bundlesLevel.getTech(o.techName, o.techPath);
        this.techPath = this.tech.getTechPath();
        this.tech.setContext(new Context(this.bundlesLevel, { level: this.levels }));

        this.__base(U.extend({ path: this.__self.createId(o) }, o));

    },

    isValid: function() {

        if (this.tech.API_VER === 2) return false;

        var _this = this;

        return Q.when(this.__base(), function(valid){
            if (!valid) return false;

            var meta = _this.getMetaNode();
            if (!_this.ctx.arch.hasNode(meta)) return false;

            return Q.all([
                    _this.readMeta(),
                    _this.lastModified(),
                    meta.lastModified()
                ])
                .spread(function(meta, nodeLastModified, metaLastModified) {

                    // expired if <tech>.meta.js is invalid
                    if (meta === null) return false;

                    // expired if .<tech>.meta.js is newer than .<tech>
                    if (metaLastModified > nodeLastModified) return false;

                    // Possible values: promised, callback, sync
                    var strategy = process.env.BEM_IO_STRATEGY_BUILD_IS_VALID || process.env.BEM_IO_STRATEGY;

                    ['promised', 'callback', 'sync'].indexOf(strategy) !== -1 || (strategy = 'callback');
                    LOGGER.fverbose('Using %s strategy in BemBuildNode.isValid()', strategy);

                    if (strategy === 'promised') {

                        // Promised build result validity check
                        return (function() {

                            var valid = true;
                            return Q.all(meta.map(function(m) {

                                return QFS.lastModified(PATH.resolve(_this.root, m))
                                    .then(function(d) {
                                        if (d > nodeLastModified) valid = false;
                                    })
                                    .fail(function() {
                                        valid = false;
                                    });

                            }))
                            .then(function() {
                                return valid;
                            });

                        })();

                    }

                    else if (strategy === 'callback') {

                        // Async build result validity check
                        return (function() {

                            var d = Q.defer(),
                                total = meta.length,
                                count = 0;

                            if (total === 0) d.resolve(true);

                            meta.forEach(function(path) {

                                FS.stat(PATH.resolve(_this.root, path), function(err, stat) {

                                    count++;

                                    if (err || stat.mtime.getTime() > nodeLastModified) d.resolve(false);
                                    if (count < total) return;
                                    d.resolve(true);

                                });

                            });

                            return d.promise;

                        })();

                    }

                    // Sync build result validity check
                    // See https://github.com/bem/bem-tools/issues/157
                    for (var i = 0, l = meta.length; i < l; i++) {
                        if (FS.statSync(PATH.resolve(_this.root, meta[i])).mtime.getTime() > nodeLastModified) return false;
                    }

                    return true;

                });
        });
    },

    make: function() {
        var opts = {
            outputLevel: this.bundlesLevel.dir,
            level: this.levelsPaths,
            declaration: PATH.resolve(this.root, this.declPath),
            tech: this.techPath,
            outputName: PATH.resolve(this.root, this.output),
            force: this.ctx.force,
            root: this.root
        };

        this.log('bem.build(forked=%j, %s)', this.forked, JSON.stringify(opts, null, 4));

        if (!this.forked) {
            opts.level = this.levels;
            return BEM.build(opts);
        }

        opts.forceCache = true;
        // TODO: generalize forking of bem commands
        var _this = this,
            d = Q.defer(),
            worker = CP.fork(PATH.join(__dirname, 'workers', 'bembuild.js'), [], { env: process.env }),
            handler = function(m) {
                (m.code !== 0)? d.reject(m.msg) : d.resolve();
            };

        /* jshint -W109 */
        worker.on('exit', function(code) {
            LOGGER.fdebug("Exit of bembuild worker for node '%s' with code %s", _this.output, code);
            handler({ code: code });
        });

        worker.on('message', function(m) {
            LOGGER.fdebug("Message from bembuild worker for node '%s': %j", _this.output, m);
            handler(m);
        });
        /* jshint +W109 */

        worker.send(opts);

        return d.promise;
    },

    readMeta: function() {
        return this._readMeta(this.getMetaNode().getPath());
    },

    _readMeta: function(path) {

        path = PATH.resolve(this.root, path);
        var _this = this,
            relativize = getPathRelativizer(this.root);

        return U.readFile(path)
            .then(function(c) {

                return VM.runInThisContext(c).map(function(f) {
                    return relativize(PATH.resolve(PATH.dirname(path), f));
                }, _this);

            })
            .fail(function() {
                return null;
            });

    },

    getMetaNode: function() {

        var node = this.metaNode || (this.metaNode = new exports.BemBuildMetaNode({
            root: this.root,
            bundlesLevel: this.bundlesLevel,
            levels: this.levelsPaths,
            declPath: this.declPath,
            techPath: this.techPath,
            techName: this.techName,
            output: this.output,
            forked: this.forked
        }));

        node.buildNode = this;

        return node;

    },

    /**
     * Get files minimum mtime in milliseconds or -1 in case of any file doesn't exist.
     *
     * @return {Promise * Number}
     */
    lastModified: function() {

        return Q.all(this.tech
            .getPaths(PATH.resolve(this.root, this.output), this.tech.getBuildSuffixes())
            .map(function(path) {

                return QFS.lastModified(path)
                    .fail(function() {
                        return -1;
                    });

            }))
            .spread(Math.min);

    },

    /**
     * clean() implementation.
     * @return {Promise * Undefined}
     */
    clean: function() {

        var _this = this;
        return Q.all(this.tech
            .getPaths(PATH.resolve(this.root, this.output), this.tech.getBuildSuffixes())
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
        return this.tech.getPaths(this.output, this.tech.getBuildSuffixes());
    },

    getDependencies: function() {

        var deps = this.tech.getDependencies().map(function(d) {
            return this.bundlesLevel.getPath(this.output, d);
        }, this);

        deps.push(this.declPath);
        return deps;

    }

}, {

    createId: function(o) {

        return o.bundlesLevel
            .getTech(o.techName, o.techPath)
            .getPath(o.output);

    }

});

var BemBuildMetaNodeName = exports.BemBuildMetaNodeName = 'BemBuildMetaNode';

/* jshint -W106 */
exports.__defineGetter__(BemBuildMetaNodeName, function() {
    return registry.getNodeClass(BemBuildMetaNodeName);
});
/* jshint +W106 */

registry.decl(BemBuildMetaNodeName, BemBuildNodeName, {

    /**
     * Overriden.
     *
     * Constructs new BemBuildMetaNode instance and changes the path property with `.bem/cache` prefix.
     *
     * @param {Object} o
     */
    __constructor: function(o) {
        this.__base(o);
        this.path = PATH.join('.bem', 'cache', this.path);
    },

    isValid: function() {

        var ctx = this.ctx;

        // expired in case of clean or other methods
        if (ctx.method && ctx.method !== 'make') return false;

        var decl = U.readDecl(PATH.resolve(this.root, this.declPath)),
            tech = this.tech,
            techv2 = !!this.tech.getBuildPaths,
            relativize = getPathRelativizer(this.root),
            prefixes = !techv2? tech.getBuildPrefixes(tech.transformBuildDecl(decl), this.levels): Q.resolve([]),
            filteredPaths = tech.filterPrefixes(prefixes, tech.getSuffixes()).invoke('map', relativize),
            savedPaths = this.readMeta();

        ctx.prefixes = prefixes;
        ctx.filteredPaths = filteredPaths;
        ctx.savedPaths = savedPaths;

        // expired if build is forced; must return after filling the ctx with promises
        if (ctx.force) return false;

        var _this = this;
        return Q.all([filteredPaths, savedPaths])
            .spread(function(filteredPaths, savedPaths) {
                if (savedPaths === null) return false;
                filteredPaths = filteredPaths || [];

                var diff = [].concat(_.difference(savedPaths, filteredPaths),
                    _.difference(filteredPaths, savedPaths));

                LOGGER.fdebug('*** isValid(%j)=%j', _this.getId(), !diff.length);
                LOGGER.fdebug('*** diff=%j', diff);
                LOGGER.fdebug('*** savedPaths=%j', savedPaths);
                LOGGER.fdebug('*** filteredPaths=%j', filteredPaths);

                return !diff.length;
            });
    },

    make: function() {
        var _this = this,
            ctx = this.ctx,
            arch = ctx.arch;

        return Q.all([ctx.filteredPaths, ctx.savedPaths])
            .spread(function(filteredPaths, savedPaths) {

                return arch.withLock(_this.alterArch(filteredPaths, savedPaths), _this)
                    .then(function() {

                        // write file list to .meta.js
                        var relativize = getPathRelativizer(PATH.dirname(_this.path)),
                            paths = filteredPaths.map(function(f) {
                                return relativize(f);
                            });

                        U.mkdirs(PATH.dirname(_this.getPath()));
                        return QFS.write(_this.getPath(), '(' + JSON.stringify(paths, null, 4) + ')');

                    });

            });
    },

    alterArch: function(filteredPaths, savedPaths) {

        return function() {

            var ctx = this.ctx,
                arch = ctx.arch,
                buildNodeId = this.buildNode.getId();


            savedPaths = savedPaths || [];
            filteredPaths = filteredPaths || [];

            // find difference with array read from file and filteredPaths
            var obsolete = _.difference(savedPaths, filteredPaths);

            // clean obsolete dependencies from arch
            obsolete.forEach(function(p) {
                if (!arch.hasNode(p)) return;

                // remove link with p
                arch.unlink(p, buildNodeId);

                // when p has no other dependent nodes, remove it from arch
                if (!arch.getParents(p).length) arch.removeNode(p);
            });

            // create nodes for all existent paths to blocks files: FileNode(path)
            filteredPaths.forEach(function(p) {
                arch.hasNode(p) || arch.addNode(new FileNode.FileNode({
                    root: this.root,
                    path: p
                }));
                // link created nodes to BemBuildNode corresponding to this node
                ctx.plan.link(p, buildNodeId);
            }, this);

            return Q.when(this.takeSnapshot('after alterArch BemBuildMetaNode ' + this.getId()));
        };

    },

    readMeta: function() {
        return this._readMeta(this.getPath());
    },

    /**
     * Get file mtime in milliseconds or -1 in case of file doesn't exist.
     *
     * @return {Promise * Number}
     */
    lastModified: function() {

        // TODO: should really use link to GeneratedFileNode.prototype.lastModified() here
        return QFS.lastModified(this.getPath())
            .fail(function() {
                return -1;
            });

    },

    /**
     * clean() implementation.
     * @return {Promise * Undefined}
     */
    clean: function() {

        // TODO: should really use link to GeneratedFileNode.prototype.clean() here
        var _this = this;
        return QFS.remove(this.getPath())
            .then(function() {
                LOGGER.fverbose('[-] Removed %j', _this.getId());
            })
            .fail(function() {});

    },

    getDependencies: function() {
        return [this.declPath];
    }

}, {

    createId: function(o) {
        return this.__base(o) + '.meta.js';
    }

});

function getPathRelativizer(from) {
    return function(p) {
        return PATH.relative(from, p);
    };
}
