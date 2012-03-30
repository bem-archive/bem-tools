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

    make: function(ctx) {
        var opts = {
            level: this.levelsPaths,
            declaration: this.declPath,
            tech: this.techPath,
            outputName: this.output
        };

        this.log('bem.build(forked=%j, %s)', this.forked, JSON.stringify(opts, null, 4));

        if (!this.forked) {
            opts.level = this.levels;
            return BEM.build(opts);
        }

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
    },

    getBuildDependencies: function(ctx) {

        // TODO: use decl tech readContent()
        var decl = require(PATH.resolve(this.declPath), true),
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
        return this.tech.getDependencies();
    }
});

var BemBuildMetaNode = exports.BemBuildMetaNode = INHERIT(BemBuildNode, {

    getId: function() {
        return this.id + '.meta.js';
    },

    isValid: function(ctx) {

        if (ctx.method != 'make') {
            ctx.prefixes = Q.ref([]);
            ctx.filteredPaths = Q.ref([]);
            ctx.savedPaths = Q.ref([]);

            return false;
        }

        // TODO: use decl tech readContent()
        var decl = require(PATH.resolve(this.declPath), true),
            tech = this.tech,
            relativize = function(p) {
                return PATH.relative(ctx.root, p);
            },
            prefixes = tech.getBuildPrefixes(tech.transformBuildDecl(decl), this.levels),
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
            arch = ctx.arch;

        return ctx.filteredPaths
            .then(function(filteredPaths){
                return arch.withLock(_this.alterArch(ctx), _this)
                    .then(function() {
                        // write file list to .meta.js
                        // TODO: store relative to .meta.js file paths
                        return QFS.write(_this.getId(), '(' + JSON.stringify(filteredPaths, null, 4) + ')');
                    });

            });

    },

    alterArch: function(ctx) {

        return function() {

            var arch = ctx.arch,
                buildNodeId = this.id,
                buildNode = arch.nodes[buildNodeId];

            // create nodes for all paths: FileNode(path, true)
            // TODO: use replaceNode()?
            return Q.when(buildNode.getBuildDependencies(ctx), function(deps){
                deps.forEach(function(d) {
                    if (!arch.hasNode(d)) {
                        arch.setNode(new FileNode(d, true));
                    }
                    // link created nodes to BemBuildNode corresponding to this node
                    arch.link(d, buildNodeId);
                });
            });

            //console.log('=== Branch %j\n', buildNodeId, arch.nodeToString(buildNodeId));

        }
    }

});
