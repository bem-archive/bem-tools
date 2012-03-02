var BEM = require('../../coa').api;

process.on('message', function (m) {
    if (m) {
        BEM.build(m).then(
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
