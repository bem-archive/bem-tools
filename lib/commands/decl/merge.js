var bemUtil = require('../../util'),
    fs = require('fs'),
    myPath = require('../../path'),
    DEPS = require('../../techs/deps.js');

exports.OptParse = function() {
    return this
        .title('Объединение.').helpful()
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
            var deps = new DEPS.Deps(),
                decl, res = [];
            while(decl = opts.declaration.shift()) {
                res.push.apply(res, deps.parse(decl.blocks || decl.deps).ol);
            }

            opts.output.write(deps.stringify(res));
        })

};
