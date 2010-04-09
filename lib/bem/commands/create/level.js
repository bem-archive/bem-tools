var fs = require('file'),
    bem_util = require('../../util'),
    Tech = require('../../tech').Tech,
    parser = exports.parser = bem_util.bemCreateParser()
        .help('уровень переопределения');

parser.option('-o', '--output-dir', 'outputDir')
        .help('директория для записи результата, по умолчанию текущая')
        .def(fs.cwdPath().join('/'))
        .set()
        .validate(function (d) {
            return fs.path(d).join('/');
        })
        .end()
    .option('-l', '--level', 'level')
        .help('"прототип"')
        .set()
        .end()
    .action(function(options){
        options.args.forEach(function(name){
            var dir = options.outputDir.join(name);
            if (dir.exists()) {
                parser.print('Пропущено "' + name + '": уже существует ' + dir);
            } else {
                dir.mkdirs();

                var proto, protoPath;
                if (options.level) {
                    try {
                        proto = require(protoPath = 'bem/levels/' + options.level);
                    } catch (ignore) {
                        try {
                            proto = require(protoPath = fs.absolute(options.level));
                        } catch (ignore) {
                            system.stderr.write('Прототип уровня переопределения "' + options.level + '" не найден');
                        }
                    }
                }

                if (proto || options.addTech || options.forceTech) {
                    var bemDir = dir.join('.bem').mkdirs(),
                        levelFile = bemDir.join('level.js'),
                        content = '';

                    proto && (content += 'var level = require(\'' +
                            (fs.isAbsolute(protoPath)? fs.path(protoPath).from(levelFile) : protoPath) + '\');\n' +
                        'for (var n in level) exports[n] = level[n];\n');

                    options.forceTech.length && (content += 'exports.techs = {\n' +
                        options.forceTech.map(function(t) {
                            var tech = new Tech(t);
                            return "    '" + tech.getTechName() + "': '" + tech.getTechRelativePath(bemDir) + "'";
                        }).join(',\n') + '\n};\n');

                    (options.addTech.length + options.noTech.length) && (content += 'exports.techs = exports.techs || {};\n' +
                        options.addTech.map(function(t, i) {
                            var tech = new Tech(t);
                            return "exports.techs['" + tech.getTechName() + "'] = '" + tech.getTechRelativePath(bemDir) + "';"; }).join('\n') +
                        '\n' +
                        options.noTech.map(function(t, i) {
                            var tech = new Tech(t);
                            return "delete exports.techs['" + tech.getTechName() + "'];"; }).join('\n') +
                        '\n');

                    levelFile.write(content);
                }
            }
        });
    })
    .helpful()
    .args('имена');
