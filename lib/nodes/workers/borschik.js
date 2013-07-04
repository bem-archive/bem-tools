'use strict';

var U = require('../../util');

// NOTE: process.once() doesn't guarantee that process
// will exit after receiving first message from master
// (node bug prior to 0.10)
process.once('message', function(m) {

    if ((process.env.YENV || '').toLowerCase() !== 'production') {
        m.minimize = false;
    }

    require('borschik').api(m)
        .then(function() {
            process.send({ code: 0 });
            U.oldNode && process.exit(0);
        })
        .fail(function(err) {
            console.log(err);
            process.send({
                code: 1,
                msg: 'borschik: ' + (err.stack || err)
            });
            U.oldNode && process.exit(1);
        })
        .done();

});
