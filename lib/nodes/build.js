var _ = require('underscore'),
    Q = require('q'),
    QFS = require('q-fs'),
    FS = require('fs'),
    INHERIT = require('inherit'),
    PATH = require('path'),
    CP = require('child_process'),
    VM = require('vm'),
    LOGGER = require('../logger'),
    BEM = require('../coa').api,
    createLevel = require('../level').createLevel,
    Context = require('../context').Context,
    U = require('../util'),

    FileNode = require('./file').FileNode,
    GeneratedFileNode = require('./file').GeneratedFileNode;

var BemBuildNode = exports.BemBuildNode = INHERIT(GeneratedFileNode, {

    __constructor: function(o) {

        this.bundlesLevel = o.bundlesLevel;
        this.levelsPaths = o.levels;
        this.levels = o.levels.map(createLevel);
        this.declPath = o.declPath;
        this.techName = o.techName;
        this.output = o.output;
        this.forked = typeof o.forked === 'undefined'? true : !!o.forked;

        // NOTE: Every time we need new tech object so we use createTech().
        // If we use getTech(), we'll overwrite context of the same tech
        // object that is prone to collisions
        this.tech = this.bundlesLevel.createTech(o.techName, o.techPath);
        this.techPath = this.tech.getTechPath();
        this.tech.setContext(new Context(this.levels));

        this.__base(U.extend({ path: this.__self.createId(o) }, o));

    },

    isValid: function() {
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

                    // Sync mtime check to get some validity boost
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
            level: this.levelsPaths,
            declaration: PATH.resolve(this.root, this.declPath),
            tech: this.techPath,
            outputName: PATH.resolve(this.root, this.output)
        };

        this.log('bem.build(forked=%j, %s)', this.forked, JSON.stringify(opts, null, 4));

        if (!this.forked) {
            opts.level = this.levels;
            return BEM.build(opts);
        }

        // TODO: generalize forking of bem commands
        var _this = this,
            d = Q.defer(),
            worker = CP.fork(PATH.join(__dirname, 'workers', 'bembuild.js'), null, { env: process.env }),
            handler = function(m) {
                (m.code !== 0)? d.reject(m.msg) : d.resolve();
            };

        worker.on('exit', function(code) {
            LOGGER.fdebug("Exit of bembuild worker for node '%s' with code %s", _this.output, code);
            handler({ code: code });
        });

        worker.on('message', function(m) {
            LOGGER.fdebug("Message from bembuild worker for node '%s': %j", _this.output, m);
            handler(m);
        });

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

        return QFS.read(path)
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

        var node = this.metaNode || (this.metaNode = new BemBuildMetaNode({
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
            .createTech(o.techName, o.techPath)
            .getPath(o.output);

    }

});

var BemBuildMetaNode = exports.BemBuildMetaNode = INHERIT(BemBuildNode, {

    isValid: function() {

        var ctx = this.ctx;

        // expired in case of clean or other methods
        if (ctx.method && ctx.method != 'make') return false;

        var decl = U.readDecl(PATH.resolve(this.root, this.declPath)),
            tech = this.tech,
            relativize = getPathRelativizer(this.root),
            prefixes = tech.getBuildPrefixes(tech.transformBuildDecl(decl), this.levels),
            filteredPaths = tech.filterPrefixes(prefixes, tech.getSuffixes())
                .invoke('map', relativize),
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
            tech = this.tech,
            arch = ctx.arch,
            relativize = getPathRelativizer(this.root),
            allPaths = ctx.prefixes.then(function(prefixes) {
                return tech.getPaths(prefixes).map(relativize);
            });

        return Q.all([allPaths, ctx.filteredPaths, ctx.savedPaths])
            .spread(function(allPaths, filteredPaths, savedPaths) {

                return arch.withLock(_this.alterArch(allPaths, filteredPaths, savedPaths), _this)
                    .then(function() {

                        // write file list to .meta.js
                        var relativize = getPathRelativizer(PATH.dirname(_this.path)),
                            paths = filteredPaths.map(function(f) {
                                return relativize(f);
                            });

                        return QFS.write(_this.getPath(), '(' + JSON.stringify(paths, null, 4) + ')');

                    });

            });
    },

    alterArch: function(allPaths, filteredPaths, savedPaths) {

        return function() {

            var ctx = this.ctx,
                arch = ctx.arch,
                buildNodeId = this.buildNode.getId();

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
                arch.hasNode(p) || arch.addNode(new FileNode({
                    root: this.root,
                    path: p
                }));
                // link created nodes to BemBuildNode corresponding to this node
                ctx.plan.link(p, buildNodeId);
            }, this);

        }

    },

    readMeta: function() {
        return this._readMeta(this.getPath());
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
    }
}
