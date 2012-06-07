var INHERIT = require('inherit'),
    Q = require('q'),
    PATH = require('path'),
    CP = require('child_process'),
    LOGGER = require('../logger'),
    U = require('../util'),

    GeneratedFileNode = require('./file').GeneratedFileNode;

exports.BorschikNode = INHERIT(GeneratedFileNode, {

    __constructor: function(o) {

        this.tech = o.tech;
        this.input = typeof o.sourceNode === 'string'
            ? o.sourceNode
            : o.sourceNode.getId();

        this.__base(U.extend({ path: PATH.join(PATH.dirname(this.input), '_' + PATH.basename(this.input)) }, o));

    },

    make: function() {

        var opts = {
            input: PATH.join(this.root, this.input),
            output: this.getPath(),
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
