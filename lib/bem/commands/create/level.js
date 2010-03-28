var fs = require('file'),
    parser = exports.parser = (new (require('args').Parser)())
        .help('уровень переопределения');

var Tech = require('../../tech').Tech;

parser.option('-o', '--output-dir', 'outputDir')
        .help('директория для записи результата, по умолчанию текущая')
        .def(fs.cwdPath().join('/'))
        .set()
        .validate(function (d) { return fs.path(d).join('/') })
        .end()
    .option('-l', '--level', 'level')
        .help('"прототип"')
        .set()
        .end()
    .option('-t', '--add-tech', 'addTech')
        .help('добавить технологию')
        .push()
        .end()
    .option('-T', '--force-tech', 'forceTech')
        .help('использовать только эту технологию')
        .push()
        .end()
    .option('-n', '--no-tech', 'noTech')
        .help('исключить технологию из использования')
        .push()
        .end()
    .action(function(options){
        options.args.forEach(function(name){
            var dir = options.outputDir.join(name);
            if (dir.exists()) {
                parser.print('Пропущено "' + name + '": уже существует ' + dir);
            } else {
                dir.mkdirs();

                var proto, protoPath;
                try { proto = require(protoPath = 'bem/levels/' + options.level) } catch (e) {
                    try { proto = require(protoPath = fs.absolute(options.level)) } catch (e) {}
                }

                if (proto || options.addTech || options.forceTech) {
                    var bemDir = dir.join('.bem').mkdirs(),
                        levelFile = bemDir.join('level.js'),
                        content = '';

                    proto && (content += 'var level = require(\'' +
                            (fs.isAbsolute(protoPath)? fs.path(protoPath).from(levelFile) : protoPath) + '\');\n' +
                        'for (var n in level) exports[n] = level[n];\n');

                    options.forceTech.length && (content += 'exports.techs = {\n' +
                        options.forceTech.map(function(techPath){
                            tech = new Tech(techPath);
                            return "    '" + tech.getTechName() + "': '" + tech.getTechRelativePath(bemDir) + "'";
                        }).join(',\n') + '\n};\n');

                    (options.addTech.length + options.noTech.length) && (content += 'exports.techs = exports.techs || {};\n' +
                        options.addTech.map(function(tech, i){
                            return "exports.techs['" + tech + "'] = true;" }).join('\n') +
                        '\n' +
                        options.noTech.map(function(tech, i){
                            return "delete exports.techs['" + tech + "'];" }).join('\n') +
                        '\n');

                    levelFile.write(content);
                }
            }
        });
    })
    .helpful()
    .args('имена');
