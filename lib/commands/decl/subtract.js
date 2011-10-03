var bemUtil = require('../../util'),
    fs = require('fs'),
    myPath = require('../../path'),
    deps = require('../../techs/deps.js');

module.exports = function() {

    return this
        .title('Вычитание.').helpful()
        .opt()
            .name('output').short('o').long('output')
            .title('файл для записи результата, если не указан используется STDOUT')
            .output()
            .end()
        .opt()
            .name('declaration').short('d').long('decl')
            .title('имя файла декларации использования, может использоваться несколько раз')
            .val(function (d) { return require(myPath.absolute(d)) })
            .arr()
            .req()
            .end()
        .act(function(opts, args) {
            var deps1 = new deps.Deps(),
                decl1 = opts.declaration.shift(),
                res = deps1.parse(decl1.blocks || decl1.deps),
                deps2, decl2;
            while(decl2 = opts.declaration.shift()) {
                deps2 = new deps.Deps();
                deps2.parse(decl2.blocks || decl2.deps);
                deps1.subtract(deps2);
            }

            opts.output.write(deps1.stringify(res.ol));
        });

};
