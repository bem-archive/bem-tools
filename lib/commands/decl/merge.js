var PATH = require('../../path'),
    DEPS = require('../../techs/deps.js');

module.exports = function() {

    return this
        .title('Merge.').helpful()
        .opt()
            .name('output').short('o').long('output')
            .title('output file, default: stdout')
            .output()
            .end()
        .opt()
            .name('declaration').short('d').long('decl')
            .title('path to the file of declaration, can be used many times')
            .val(function (d) { return typeof d == 'string'? require(PATH.absolute(d)) : d })
            .arr()
            .req()
            .end()
        .act(function(opts, args) {
            var deps = new DEPS.Deps(),
                decl, res = [];
            while(decl = opts.declaration.shift()) {
                res.push.apply(res, deps.parse(decl.blocks || decl.deps).ol);
            }

            opts.output.write(deps.stringify(res));
            if (opts.output != process.stdout) opts.output.end();
        });

};
