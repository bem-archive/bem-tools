var UTIL = require('../../util'),
    MemoryStream = require('memorystream');

// NOTE: process.once() doesn't guarantee that process
// will exit after receiving first message from master
// (node bug?)
process.once('message', function(m) {

    var prod = (process.env.YENV || '').toLowerCase() === 'production',
        boutput = '',
        outputFile = m.output;

    if (prod) {
        m.output = new MemoryStream();
        m.output.on('data', function(data) {
            boutput += data.toString();
        });
    }

    require('borschik').api(m)
        .then(function(){
            if (!prod) return;

            if (outputFile.match(/\.css$/)) return UTIL.writeFile(
                outputFile,
                require('csso').justDoIt(boutput));

            if (outputFile.match(/\.js$/)) return UTIL.writeFile(
                outputFile,
                require("uglify-js")(boutput));
        })
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
