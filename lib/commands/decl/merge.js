var bemUtil = require('../../util'),
    fs = require('fs'),
    myPath = require('../../path');

module.exports = function() {

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
            .val(function (d) { return require(myPath.absolute(d)) })
            .arr()
            .req()
            .end()
        .act(function(opts, args) {
            var decl1 = opts.declaration.shift().blocks, decl2;
            while(decl2 = opts.declaration.shift()) {
                decl1 = bemUtil.mergeDecls(decl1, decl2.blocks);
            }

            opts.output.write('exports.blocks = ' + JSON.stringify(decl1) + ';\n');
        });

};
