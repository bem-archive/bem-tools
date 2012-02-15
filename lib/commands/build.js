var Q = require('q'),
    PATH = require('../path'),
    Tech = require('../tech').Tech,
    createLevel = require('../level').createLevel,
    Context = require('../context').Context;

module.exports = function() {

    return this
        .title('Build tool.').helpful()
        .opt()
            .name('declaration').short('d').long('decl')
            .title('path to the file of declaration, required')
            .val(function (d) { return typeof d == 'string'? require(PATH.absolute(d)) : d })
            .req()
            .end()
        .opt()
            .name('level').short('l').long('level')
            .title('override level, can be used many times')
            .val(function (l) { return typeof l == 'string'? createLevel(l) : l })
            .arr()
            .end()
        .opt()
            .name('tech').short('t').long('tech')
            .title('technologies to build, can be used many times')
            .arr()
            .end()
        .opt()
            .name('outputDir').short('o').long('output-dir')
            .title('output directory, cwd by default')
            .def(process.cwd())
            .val(function (d) { return PATH.join(d, PATH.dirSep) })
            .end()
        .opt()
            .name('outputName').short('n').long('output-name')
            .title('output file prefix')
            .end()
        .act(function (opts, args) {
            var context = new Context(opts.level, opts);

            // FIXME: унести на уровень выше, например в обработку опций
            Tech.setContext(context);

            var prefixes = [],
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
                },
                forBlockDecl = function (block) {
                    // для самого блока
                    forItemWithMods(block);

                    // для каждого элемента в блоке
                    block.elems && block.elems.forEach(function (elem) {
                        forItemWithMods(block, elem);
                    });
                },
                forBlocksDecl = function (blocks) {
                    // для каждого блока в декларации
                    blocks.forEach(forBlockDecl);
                },
                forDepsDecl = function (deps) {
                    deps.forEach(function (dep) {
                        if(dep.block) {
                            var getter = 'block',
                                args = [dep.block];

                            if(dep.elem) {
                                getter = 'elem';
                                args.push(dep.elem);
                            }

                            if(dep.mod) {
                                getter += '-mod';
                                args.push(dep.mod);
                                if(dep.val) {
                                    getter += '-val';
                                    args.push(dep.val);
                                }
                            }

                            eachLevel(getter, args);
                        }
                    });
                },
                decl = opts.declaration;

            decl.name && forBlockDecl(decl);
            decl.blocks && forBlocksDecl(decl.blocks);
            decl.deps && forDepsDecl(decl.deps);

            // для каждой технологии
            var done;
            context.getTechs().forEach(function (techIdent) {

                var tech = context.getTech(techIdent);
                // сериализовать контейнер префиксов файлов технологии согласно параметрам вывода
                done = Q.wait(done, tech.build(prefixes, opts.outputDir, opts.outputName));

            });

            return done;
        });

};
