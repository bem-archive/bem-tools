var INHERIT = require('inherit'),
    Q = require('q'),
    PATH = require('path'),
    CP = require('child_process'),
    createLevel = require('../level').createLevel,

    GeneratedFileNode = require('./file').GeneratedFileNode,

    B = require('borschik').api;

exports.BorschikNode = INHERIT(GeneratedFileNode, {

    __constructor: function(level, importsNode, tech, forked) {

        this.level = typeof level == 'string'? createLevel(level) : level;
        this.imports = importsNode;
        this.tech = tech;
        this.forked = forked;

        this.input = typeof importsNode === 'string'?
                            importsNode:
                            importsNode.getId();

            var id = PATH.join(
                PATH.dirname(this.input),
                '_' + PATH.basename(this.input)
            );

        this.__base(id);
    },

    make: function() {
        var _this = this,
            opts = {
                input: this.input,
                output: this.getId(),
                tech: this.tech
            };

        if (!this.forked) {
            return Q.when(B(null, opts));
        }

        var d = Q.defer(),
            worker = CP.fork(PATH.join(__dirname, 'workers', 'borschik.js'), null, { env: process.env });

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

