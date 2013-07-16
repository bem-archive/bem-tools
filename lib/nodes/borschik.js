'use strict';

var Q = require('q'),
    PATH = require('path'),
    CP = require('child_process'),
    LOGGER = require('../logger'),
    U = require('../util'),
    registry = require('../nodesregistry'),

    GeneratedFileNode = require('./file').GeneratedFileNodeName,

    BorschikNodeName = exports.BorschikNodeName = 'BorschikNode';

/* jshint -W106 */
exports.__defineGetter__(BorschikNodeName, function() {
    return registry.getNodeClass(BorschikNodeName);
});
/* jshint +W106 */

registry.decl(BorschikNodeName, GeneratedFileNode, {

    nodeType: 8,

    __constructor: function(o) {

        this.tech = o.tech;
        this.input = typeof o.input === 'string' ?
            o.input :
            o.input.getId();
        this.output = PATH.join(PATH.dirname(this.input), '_' + PATH.basename(this.input));

        this.__base(U.extend({ path: this.output }, o));

    },

    /* jshint -W109 */
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
            worker = CP.fork(PATH.join(__dirname, 'workers', 'borschik.js'), [], { env: process.env }),
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
    /* jshint +W109 */

});
