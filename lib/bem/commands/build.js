var fs = require('file'),
    os = require('os'),
    Tech = require('../tech').Tech,
    Level = require('../level').Level,
    parser = exports.parser = (new (require('args').Parser)())
        .help('сборка файлов')
        .option('-d', '--decl', 'declaration')
            .help('имя файла декларации использования, обязательный параметр')
            .set()
            .validate(function (d) { return require(fs.absolute(d)) })
            .end()
        .option('-l', '--level', 'level')
            .help('уровень переопределения, может использоваться несколько раз')
            .validate(function (l) {
                // NOTE: из-за push-а validate вызывается дважды, сначала для исходного значения, потом для провалидированного
                return (typeof l == 'string') ? new Level(l) : l;
            })
            .push()
            .end()
        .option('-t', '--tech', 'tech')
            .help('создавать файлы заданной технологии, может использоваться несколько раз')
            .validate(function (t) {
                // NOTE: из-за push-а validate вызывается дважды, сначала для исходного значения, потом для провалидированного
                return (typeof t == 'string') ? new Tech(t) : t;
            })
            .push()
            .end()
        .option('-o', '--output-dir', 'outputDir')
            .help('директория для записи результата, по умолчанию текущая')
            .def(fs.cwdPath().join('/'))
            .set()
            .validate(function (d) { return fs.path(d).join('/') })
            .end()
        .option('-n', '--output-name', 'outputName')
            .help('имя для записи результата')
            .set()
            .end()
        .helpful()
        .action(function (options) {
            if (!options.declaration) {
                parser.print('Пропущен обязательный параметр декларации использования');
                parser.exit(1);
            }

            // для каждой технологии
            options.tech.forEach(function (tech) {
                var prefixes = [],
                    eachLevel = function (getter, args) {
                            // для каждого уровня переопределения
                            options.level.forEach(function (level) {
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
                options.declaration.blocks.forEach(function (block) {

                    // для самого блока
                    forItemWithMods(block);

                    // для каждого элемента в блоке
                    block.elems && block.elems.forEach(function (elem) {
                        forItemWithMods(block, elem);
                    });

                });

                // сериализовать контейнер префиксов файлов технологии согласно параметрам вывода
                tech.bemBuild(prefixes, options.outputDir, options.outputName);

            });

        });
