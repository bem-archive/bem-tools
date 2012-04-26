var B = require('borschik').api,
    Q = require('q');

process.on('message', function (m) {
    if (m) {
        return Q.when(B(null, m),
            function (r) {
                process.send({
                        code: 0,
                        msg: true
                    }
                );
                process.exit(0);
            },
            function (error) {
                process.send({
                        code: 1,
                        msg: error.stack
                    }
                );
                process.exit(1);
            }
        );
    }
});
