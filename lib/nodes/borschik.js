var INHERIT = require('inherit'),
    Q = require('q'),
    PATH = require('path'),
    CP = require('child_process'),
    createLevel = require('../level').createLevel,

    GeneratedFileNode = require('./file').GeneratedFileNode,

    B = require('borschik').api;

exports.BorschikNode = INHERIT(GeneratedFileNode, {

    __constructor: function(sourceNode, tech, forked) {

        this.tech = tech;
        this.forked = forked;

        this.input = typeof sourceNode === 'string'
            ? sourceNode
            : sourceNode.getId();
        this.output = PATH.join(PATH.dirname(this.input), '_' + PATH.basename(this.input));

        this.__base(this.output);
    },

    make: function(ctx) {
        var opts = {
            input: PATH.join(ctx.root, this.input),
            output: PATH.join(ctx.root, this.output),
            tech: this.tech
        };

        if (!this.forked) return B(opts);

        var d = Q.defer(),
            worker = CP.fork(PATH.join(__dirname, 'workers', 'borschik.js'), null, { env: process.env });

        worker.on('message', function(m) {
            (m.code !== 0)? d.reject(m.msg) : d.resolve();
        });

        worker.send(opts);

        return d.promise;
    }
});

