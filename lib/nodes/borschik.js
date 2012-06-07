var INHERIT = require('inherit'),
    Q = require('q'),
    PATH = require('path'),
    CP = require('child_process'),
    LOGGER = require('../logger'),
    createLevel = require('../level').createLevel,

    GeneratedFileNode = require('./file').GeneratedFileNode;

exports.BorschikNode = INHERIT(GeneratedFileNode, {

    __constructor: function(sourceNode, tech) {

        this.tech = tech;

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

        this.log('borschik(%s)', JSON.stringify(opts, null, 4));

        LOGGER.fdebug("Launching borschik worker for node '%s'", this.output);

        var _this = this,
            d = Q.defer(),
            worker = CP.fork(PATH.join(__dirname, 'workers', 'borschik.js'), null, { env: process.env }),
            handler = function(m) {
                (m.code !== 0)? d.reject(m.msg) : d.resolve();
            };

        worker.on('exit', function(code) {
            LOGGER.fdebug("Exit of borschik worker for node '%s' with code %s", _this.output, code);
            handler({ code: code });
        });

        worker.on('message', function(m) {
            LOGGER.fdebug("Message from borschik worker for node '%s': %j", _this.output, m);
            handler(m);
        });

        worker.send(opts);

        return d.promise;
    }
});

