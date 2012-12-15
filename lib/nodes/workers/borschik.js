// NOTE: process.once() doesn't guarantee that process
// will exit after receiving first message from master
// (node bug?)
process.once('message', function(m) {

    if ((process.env.YENV || '').toLowerCase() !== 'production') {
        m.minimize = false;
    }

    require('borschik').api(m)
        .then(function() {
            process.send({ code: 0 });
            process.exit(0);
        })
        .fail(function(err) {
            process.send({
                code: 1,
                msg: 'borschik: ' + (err.stack || err)
            });
            process.exit(1);
        })
        .done();

});
