var Q = require('q'),
    PATH = require('../../path'),
    DEPS = require('../../techs/deps.js'),
    U = require('../../util');

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
            .val(function (d) { return typeof d == 'string'? U.readDecl(PATH.absolute(d)) : d })
            .arr()
            .req()
            .end()
        .act(function(opts, args) {

            return Q.all(opts.declaration)
                .then(function(decls) {

                    var deps1 = new DEPS.Deps(),
                        decl1 = decls.shift(),
                        deps2, decl2;

                    deps1.parseDepsDecl(decl1);

                    while(decl2 = decls.shift()) {
                        deps2 = new DEPS.Deps();
                        deps2.parseDepsDecl(decl2);
                        deps1.merge(deps2);
                    }

                    opts.output.write(deps1.stringify());
                    if (opts.output != process.stdout) opts.output.end();

                });

        });

};
