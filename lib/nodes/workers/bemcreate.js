'use strict';

var U = require('../../util');

// NOTE: process.once() doesn't guarantee that process
// will exit after receiving first message from master
// (node bug prior to 0.10)
process.once('message', function(m) {

    require('../../coa').api.create(m.opts, m.args)
        .then(function() {
            process.send({ code: 0 });
            U.oldNode && process.exit(0);
        })
        .fail(function(err) {
            process.send({
                code: 1,
                msg: err && err.stack
            });
            U.oldNode && process.exit(1);
        })
        .done();

});
