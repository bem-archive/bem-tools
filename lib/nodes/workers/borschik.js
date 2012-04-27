process.once('message', function(m) {

    require('borschik').api(m)
        .then(function() {
            process.send({ code: 0 });
        })
        .fail(function (error) {
            process.send({
                code: 1,
                msg: error.stack
            });
        })
        .fin(function() {
            process.exit(0);
        })
        .end();

});
