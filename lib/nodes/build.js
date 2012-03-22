var _ = require('underscore'),
    Q = require('q'),
    QFS = require('q-fs'),
    INHERIT = require('inherit'),
    PATH = require('path'),
    CP = require('child_process'),
    VM = require('vm'),
    BEM = require('../coa').api,
    createLevel = require('../level').createLevel,
    Context = require('../context').Context,

    FileNode = require('./file').FileNode,
    GeneratedFileNode = require('./file').GeneratedFileNode,

    require = require('../util').require;

var BemBuildNode = exports.BemBuildNode = INHERIT(GeneratedFileNode, {

    __constructor: function(levels, decl, techPath, techName, output, forked) {
        this.levelsPaths = levels;
        this.levels = levels.map(function(l) {
            return typeof l == 'string'? createLevel(l) : l;
        });
        this.declPath = decl;
        this.decl = require(PATH.resolve(decl), true);
        this.techPath = techPath;
        this.techName = techName;
        this.output = output;
        this.forked = !!forked;

        var ctx = new Context(this.levels);
        this.tech = ctx.getTech(techName, techPath);

        this.__base(this.tech.getPath(this.output));
    },

    make: function(ctx) {
        var opts;

        this.log('bem.build(forked=%j, %s)', this.forked, JSON.stringify({
            level: this.levelsPaths,
            declaration: this.declPath,
            tech: this.techPath,
            outputName: this.output
        }, null, 4));

        if (!this.forked) {
            opts = {
                level: this.levels,
                declaration: this.decl,
                tech: this.techPath,
                outputName: this.output
            };

            return BEM.build(opts);
        }

        opts = {
            level: this.levelsPaths,
            declaration: this.declPath,
            tech: this.techPath,
            outputName: this.output
        };

        // TODO: generalize forking of bem commands
        var d = Q.defer(),
            worker = CP.fork(PATH.join(__dirname, 'workers', 'bembuild.js'), null, { env: process.env });

        worker.on('exit', function(code) {
            (code === 0)? d.resolve() : d.reject();
        });

        worker.on('message', function(m) {
            (m.code !== 0)? d.reject(m.msg) : d.resolve(m.msg);
        });

        worker.send(opts);

        return d.promise;
    },

    getMetaNode: function() {
        return new BemBuildMetaNode(
            this.levelsPaths,
            this.declPath,
            this.techPath,
            this.techName,
            this.output,
            this.forked);
    }

});

var BemBuildMetaNode = exports.BemBuildMetaNode = INHERIT(BemBuildNode, {

    getId: function() {
        return this.id + '.meta.js';
    },

    isValid: function(ctx) {
        var tech = this.tech,
            relativize = function(p) {
                return PATH.relative(ctx.root, p);
            },
            prefixes = tech.getBuildPrefixes(tech.transformBuildDecl(this.decl), this.levels),
            filteredPaths = tech.filterPrefixes(prefixes, tech.getSuffixes())
                .invoke('map', relativize),
            savedPaths = QFS.read(PATH.resolve(this.getId()))
                .then(function(c) {
                    // TODO: read relative to .meta.js file paths
                    return VM.runInThisContext(c);
                })
                .fail(function() {
                    return [];
                });

        ctx.prefixes = prefixes;
        ctx.filteredPaths = filteredPaths;
        ctx.savedPaths = savedPaths;

        return Q.all([filteredPaths, savedPaths])
            .spread(function(filteredPaths, savedPaths) {
                var diff = [].concat(_.difference(savedPaths, filteredPaths),
                    _.difference(filteredPaths, savedPaths));

                //console.log('*** isValid(%j)=%j', _this.getId(), !diff.length);
                //console.log('*** diff=%j', diff);

                return !diff.length;
            });
    },

    make: function(ctx) {
        var _this = this,
            tech = this.tech,
            arch = ctx.arch,
            relativize = function(p) {
                return PATH.relative(ctx.root, p);
            },
            allPaths = ctx.prefixes.then(function(prefixes) {
                return tech.getPaths(prefixes).map(relativize);
            });

        return Q.all([allPaths, ctx.filteredPaths, ctx.savedPaths])
            .spread(function(allPaths, filteredPaths, savedPaths) {

                arch.withLock(function() {

                    var buildNode = _this.id;

                    // create nodes for all paths: FileNode(path, true)
                    // TODO: use replaceNode()?
                    allPaths.forEach(function(p) {
                        if (!arch.hasNode(p)) {
                            arch.setNode(new FileNode(p, true));
                        }
                        // link created nodes to BemBuildNode corresponding to this node
                        arch.link(p, buildNode);
                    });

                    // find difference with array read from file and filteredPaths
                    var obsolete = _.difference(savedPaths, filteredPaths);

                    // clean obsolete dependencies then from arch
                    obsolete.forEach(function(p) {
                        arch.unlink(p, buildNode);
                        // TODO: when p has no other dependent nodes, remove it from arch
                    });

                    //console.log('=== Branch %j\n', buildNode, arch.nodeToString(buildNode));
                });

                // write file list to .meta.js
                // TODO: store relative to .meta.js file paths
                return QFS.write(_this.getId(), '(' + JSON.stringify(filteredPaths, null, 4) + ')');
            });

    }

});
