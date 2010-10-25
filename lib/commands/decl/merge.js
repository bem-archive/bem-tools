var bemUtil = require('../../util'),
    fs = require('fs'),
    myPath = require('../../path');

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
            var decl1 = opts.declaration.shift().blocks, decl2;
            while(decl2 = opts.declaration.shift()) {
                decl1 = exports.mergeDecls(decl1, decl2.blocks);
            }

            opts.output.write('exports.blocks = ' + JSON.stringify(decl1) + ';\n');
        })

};

exports.mergeDecls = function mergeDecls(d1, d2) {
    d1 || (d1 = []);
    var keys = {};
    d1.forEach(function(o){ keys[o.name || o] = o });

    d2.forEach(function(o2){
        if (keys.hasOwnProperty(o2.name || o2)) {
            var o1 = keys[o2.name || o2];
            o2.elems && (o1.elems = mergeDecls(o1.elems, o2.elems));
            o2.mods && (o1.mods = mergeDecls(o1.mods, o2.mods));
            o2.vals && (o1.vals = mergeDecls(o1.vals, o2.vals));
        } else {
            d1.push(o2);
        }
    });

    return d1;
};

