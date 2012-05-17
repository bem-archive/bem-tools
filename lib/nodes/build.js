var _ = require('underscore'),
    Q = require('q'),
    QFS = require('q-fs'),
    INHERIT = require('inherit'),
    PATH = require('path'),
    CP = require('child_process'),
    VM = require('vm'),
    LOGGER = require('../logger'),
    BEM = require('../coa').api,
    createLevel = require('../level').createLevel,
    Context = require('../context').Context,

    FileNode = require('./file').FileNode,
    GeneratedFileNode = require('./file').GeneratedFileNode,

    require = require('../util').requireWrapper(require);

var BemBuildNode = exports.BemBuildNode = INHERIT(GeneratedFileNode, {

    __constructor: function(levels, decl, techPath, techName, output, forked) {
        this.levelsPaths = levels;
        this.levels = levels.map(function(l) {
            return typeof l == 'string'? createLevel(l) : l;
        });
        this.declPath = decl;
        this.techPath = techPath;
        this.techName = techName;
        this.output = output;
        this.forked = !!forked;

        var ctx = new Context(this.levels);
        this.tech = ctx.getTech(techName, techPath);

        this.__base(this.tech.getPath(this.output));
    },

    isValid: function(ctx) {
        var _this = this;

        return Q.when(this.__base(ctx), function(valid){
            if (!valid) return false;

            var meta = _this.getMetaNode();
            if (!ctx.arch.hasNode(meta)) return false;

            return Q.all([
                    _this.readMeta(ctx),
                    _this.lastModified(),
                    meta.lastModified()
                ])
                .spread(function(meta, nodeLastModified, metaLastModified) {

                    // expired if <tech>.meta.js is invalid
                    if (meta === null) return false;

                    // expired if .<tech>.meta.js is newer than .<tech>
                    if (metaLastModified > nodeLastModified) return false;

                    var valid = true;
                    return Q.all(meta.map(function(m) {

                        return QFS.lastModified(m)
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

                });
        });
    },

    make: function(ctx) {
        var opts = {
            level: this.levelsPaths,
            declaration: PATH.resolve(ctx.root, this.declPath),
            tech: this.techPath,
            outputName: PATH.resolve(ctx.root, this.output)
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

    readMeta: function(ctx) {
        return this._readMeta(ctx, this.getMetaNode().getPath());
    },

    _readMeta: function(ctx, path) {

        path = PATH.resolve(ctx.root, path);
        var _this = this,
            relativize = getPathRelativizer(ctx.root);

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
        return (this.metaNode || (this.metaNode = new BemBuildMetaNode(
            this.levelsPaths,
            this.declPath,
            this.techPath,
            this.techName,
            this.output,
            this.forked)));
    },

    getBuildDependencies: function(ctx) {

        // TODO: use decl tech readContent()
        var decl = require(PATH.resolve(ctx.root, this.declPath), true),
            tech = this.tech,
            relativize = function(p) {
                return PATH.relative(ctx.root, p);
            },
            prefixes = tech.getBuildPrefixes(tech.transformBuildDecl(decl), this.levels);

        return prefixes.then(function(prefixes) {
            return tech.getPaths(prefixes, tech.getSuffixes()).map(relativize);
        });

    },

    getCreateDependencies: function(ctx) {

        var deps = this.tech.getDependencies().map(function(d) {
            return this.output + '.' + d;
        }, this);

        deps.push(this.declPath);
        return deps;

    }

});

var BemBuildMetaNode = exports.BemBuildMetaNode = INHERIT(BemBuildNode, {

    getId: function() {
        return this.getPath();
    },

    getPath: function() {
        return this.path + '.meta.js';
    },

    isValid: function(ctx) {

        // expired in case of clean or other methods
        if (ctx.method && ctx.method != 'make') return false;

        // TODO: use decl tech readContent()
        var decl = require(PATH.resolve(ctx.root, this.declPath), true),
            tech = this.tech,
            relativize = getPathRelativizer(ctx.root),
            prefixes = tech.getBuildPrefixes(tech.transformBuildDecl(decl), this.levels),
            filteredPaths = tech.filterPrefixes(prefixes, tech.getSuffixes())
                .invoke('map', relativize),
            savedPaths = this.readMeta(ctx);

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

    make: function(ctx) {
        var _this = this,
            tech = this.tech,
            arch = ctx.arch,
            relativize = getPathRelativizer(ctx.root),
            allPaths = ctx.prefixes.then(function(prefixes) {
                return tech.getPaths(prefixes).map(relativize);
            });

        return Q.all([allPaths, ctx.filteredPaths, ctx.savedPaths])
            .spread(function(allPaths, filteredPaths, savedPaths) {

                return arch.withLock(_this.alterArch(ctx, allPaths, filteredPaths, savedPaths), _this)
                    .then(function() {

                        // write file list to .meta.js
                        var relativize = getPathRelativizer(PATH.dirname(_this.getPath())),
                            paths = filteredPaths.map(function(f) {
                                return relativize(f);
                            });

                        return QFS.write(PATH.resolve(ctx.root, _this.getPath()), '(' + JSON.stringify(paths, null, 4) + ')');

                    });

            });
    },

    alterArch: function(ctx, allPaths, filteredPaths, savedPaths) {

        return function() {

            var arch = ctx.arch,
                buildNodeId = this.id,
                buildNode = arch.getNode(buildNodeId);

            // find difference with array read from file and filteredPaths
            var obsolete = _.difference(savedPaths, filteredPaths);

            // clean obsolete dependencies then from arch
            obsolete.forEach(function(p) {
                if (arch.hasNode(p)) arch.unlink(p, buildNodeId);
                // TODO: when p has no other dependent nodes, remove it from arch
            });

            // create nodes for all paths: FileNode(path, true)
            return Q.when(buildNode.getBuildDependencies(ctx), function(deps){
                deps.forEach(function(d) {
                    arch.hasNode(d) || arch.addNode(new FileNode(d, true));
                    // link created nodes to BemBuildNode corresponding to this node
                    ctx.plan.link(d, buildNodeId);
                });
            });

            //console.log('=== Branch %j\n', buildNodeId, arch.nodeToString(buildNodeId));
        }

    },

    readMeta: function(ctx) {
        return this._readMeta(ctx, this.getPath());
    }

});

function getPathRelativizer(from) {
    return function(p) {
        return PATH.relative(from, p);
    }
}
