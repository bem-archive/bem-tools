// NOTE: process.once() doesn't guarantee that process
// will exit after receiving first message from master
// (node bug?)
process.once('message', function(m) {

    require('../../coa').api.build(m)
        .then(function() {
            process.send({ code: 0 });
            process.exit(0);
        })
        .fail(function(err) {
            process.send({
                code: 1,
                msg: err.stack
            });
            process.exit(1);
        })
        .end();

});
