var Q = require('q'),
    INHERIT = require('inherit'),
    PATH = require('path'),
    CP = require('child_process'),
    BEM = require('../coa').api,
    createLevel = require('../level').createLevel,
    Context = require('../context').Context,

    GeneratedFileNode = require('./file').GeneratedFileNode;

var BemBuildNode = exports.BemBuildNode = INHERIT(GeneratedFileNode, {

    __constructor: function(levels, decl, techPath, techName, output) {
        this.levelsPaths = levels;
        this.levels = levels.map(function(l) {
            return typeof l == 'string'? createLevel(l) : l;
        });
        this.decl = decl;
        this.techPath = techPath;
        this.output = output;

        var ctx = new Context(this.levels);
        this.tech = ctx.getTech(techName, techPath);

        this.__base(this.tech.getPath(this.output));
    },

    make: function() {
        var opts = {
            level: this.levelsPaths,
            declaration: this.decl,
            tech: this.techPath,
            outputDir: PATH.dirname(this.output),
            outputName: PATH.basename(this.output)
        };

        this.log('bem.build(\n %j\n)', opts);

        return BEM.build(opts);
    }

});

// TODO: implement
exports.BemBuildDepsNode = INHERIT(BemBuildNode, {

    getId: function() {
        return this.id + '!';
    },

    make: function(ctx) {
        // get tech object
        // get prefixes
        // get paths
        // clean not actual dependencies
        // create nodes for all paths: FileNode(path, true); use replaceNode()
        // link created nodes to BemBuildNode corresponding to this node
        // remember created nodes
    }

});

exports.BemBuildForkedNode = INHERIT(BemBuildNode, {

    make: function() {
        var opts = {
            level: this.levelsPaths,
            declaration: this.decl,
            tech: this.techPath,
            outputDir: PATH.dirname(this.output),
            outputName: PATH.basename(this.output)
        };

        this.log('bem.build(\n %j\n)', opts);

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
    }
});
