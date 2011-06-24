var bemUtil = require('../../util'),
    fs = require('fs'),
    myPath = require('../../path'),
    deps = require('../../techs/deps.js');

exports.OptParse = function() {
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
            .validate(function (d) { return require(myPath.absolute(d)) })
            .push()
            .required()
            .end()
        .act(function(opts, args) {
            var deps1 = new deps.Deps(),
                res = deps1.parse(opts.declaration.shift().blocks),
                deps2, decl2;
            while(decl2 = opts.declaration.shift()) {
                deps2 = new deps.Deps();
                deps2.parse(decl2.blocks);
                deps1.subtract(deps2);
            }

            opts.output.write(deps1.stringify(res.ol));
        })

};
