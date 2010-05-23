var fs = require('file'),
    bemUtil = require('../../util'),
    parser = exports.parser = bemUtil.bemCreateParser()
        .help('объединение');

var mergeDecls = exports.mergeDecls = function (d1, d2) {
    d1 || (d1 = []);
    var keys = {};
    d1.forEach(function(o){ keys[o.name || o] = o });

    d2.forEach(function(o2){
        if (keys.hasOwnProperty(o2.name)) {
            var o1 = keys[o2.name || o2];
            o2.elems && (o1.elems = mergeDecls(o1.elems, o2.elems));
            o2.mods && (o1.mods = mergeDecls(o1.mods, o2.mods));
            o2.vals && (o1.vals = mergeDecls(o1.vals, o2.vals));
        } else {
            d1.push(o2);
        }
    });

    return d1;
}

parser.option('-o', '--output', 'output')
        .help('файл для записи результата, если не указан используется STDOUT')
        .def(system.stdout)
        .output();

parser.option('-d', '--decl', 'declaration')
        .help('имя файла декларации использования, может использоваться несколько раз')
        .set()
        // NOTE: из-за push-а validate вызывается дважды, сначала для исходного значения, потом для провалидированного
        .validate(function (d) { return (typeof d == 'string') ? require(fs.absolute(d)) : d })
        .push()
        .end()
    .action(function(options){
        if (!options.declaration.length) {
            parser.print('Пропущен обязательный параметр декларации использования')
            parser.exit(1);
        }
        var decl1 = options.declaration.shift().blocks, decl2;
        while(decl2 = options.declaration.shift()) {
            decl1 = mergeDecls(decl1, decl2.blocks);
        }
        options.output.write('exports.blocks = ' + JSON.encode(decl1, null, 4) + ';\n');
    })
    .helpful();
