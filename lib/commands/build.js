var myPath = require('../path'),
    Tech = require('../tech').Tech,
    Level = require('../level').Level,
    Context = require('../context').Context;

exports.OptParse = function() {
    return this
        .title('Сборка файлов.').helpful()
        .opt()
            .name('declaration').short('d').long('decl')
            .title('имя файла декларации использования, обязательный параметр')
            .validate(function (d) { return require(myPath.absolute(d)) })
            .required()
            .end()
        .opt()
            .name('level').short('l').long('level')
            .title('уровень переопределения, может использоваться несколько раз')
            .validate(function (l) { return typeof l == 'string'? new Level(l) : l })
            .push()
            .end()
        .opt()
            .name('tech').short('t').long('tech')
            .title('создавать файлы заданной технологии, может использоваться несколько раз')
            .push()
            .end()
        .opt()
            .name('outputDir').short('o').long('output-dir')
            .title('директория для записи результата, по умолчанию текущая')
            .def(process.cwd())
            .validate(function (d) { return myPath.join(d, '/') })
            .end()
        .opt()
            .name('outputName').short('n').long('output-name')
            .title('имя для записи результата')
            .end()
        .act(function (opts, args) {
            var context = new Context(opts.level, opts);

            // для каждой технологии
            context.getTechs().forEach(function (techIdent) {
                var tech = context.getTech(techIdent),
                    prefixes = [],
                    eachLevel = function (getter, args) {
                            // для каждого уровня переопределения
                            context.getLevels().forEach(function (level) {
                                // получить префикс файла
                                prefixes.push(level.get(getter, args));
                            });
                        },
                    forItemWithMods = function (block, elem) {
                            var item = elem || block,
                                type = elem? 'elem' : 'block',
                                args = elem? [block.name, elem.name] : [block.name];

                            // для самого блока или элемента
                            eachLevel(type, args);

                            // для каждого модификатора
                            item.mods && item.mods.forEach(function (mod) {

                                // для самого модификатора
                                eachLevel(type + '-mod', args.concat(mod.name));

                                // для каждого значения модификатора
                                mod.vals && mod.vals.forEach(function (val) {
                                    eachLevel(type + '-mod-val', args.concat(mod.name, val.name || val));
                                });

                            });
                        };

                // для каждого блока в декларации
                opts.declaration.blocks.forEach(function (block) {

                    // для самого блока
                    forItemWithMods(block);

                    // для каждого элемента в блоке
                    block.elems && block.elems.forEach(function (elem) {
                        forItemWithMods(block, elem);
                    });

                });

                // сериализовать контейнер префиксов файлов технологии согласно параметрам вывода
                tech.bemBuild(prefixes, opts.outputDir, opts.outputName);

            });
        });
};
