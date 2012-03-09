var Q = require('q'),
    INHERIT = require('inherit'),
    PATH = require('path'),
    CP = require('child_process'),
    BEM = require('../coa').api,
    createLevel = require('../level').createLevel,
    Context = require('../context').Context,

    FileNode = require('./file').FileNode,
    GeneratedFileNode = require('./file').GeneratedFileNode;

var BemBuildNode = exports.BemBuildNode = INHERIT(GeneratedFileNode, {

    __constructor: function(levels, decl, techPath, techName, output, forked) {
        this.levelsPaths = levels;
        this.levels = levels.map(function(l) {
            return typeof l == 'string'? createLevel(l) : l;
        });
        this.declPath = decl;
        this.decl = require(PATH.resolve(decl));
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
        return this.id + '*';
    },

    make: function(ctx) {
        var _this = this,
            arch = ctx.arch,
            tech = this.tech,
            prefixes = tech.getBuildPrefixes(tech.transformBuildDecl(this.decl), this.levels);

        return Q.when(prefixes)
            .then(function(prefixes) {
                arch.withLock(function() {

                    var buildNode = _this.id,
                        paths = tech.getPaths(prefixes).map(function(p) {
                            return PATH.relative(ctx.root, p);
                        });

                    // create nodes for all paths: FileNode(path, true); use replaceNode()
                    paths.forEach(function(p) {
                        // TODO: remember created nodes
                        if (!arch.hasNode(p)) {
                            //console.log('*** create node %j', p);
                            arch.setNode(new FileNode(p, true));
                        }
                        //console.log('*** depend %j on %j', buildNode, p);
                        // link created nodes to BemBuildNode corresponding to this node
                        arch.link(p, buildNode);
                    });

                    //console.log('=== Branch %j\n', buildNode, arch.nodeToString(buildNode));
                });

                // TODO: clean not actual dependencies
            });

    },

    createBuildNode: function() {
        return new BemBuildNode(
            this.levelsPaths,
            this.declPath,
            this.techPath,
            this.techName,
            this.output,
            this.forked);
    }

});
