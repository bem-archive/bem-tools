var bemUtil = require('../../util'),
    sys = require('sys'),
    fs = require('fs'),
    myPath = require('../../path'),
    Tech = require('../../tech').Tech;

exports.OptParse = function() {
    return this
        .title('Уровень переопределения.').helpful()
        .apply(bemUtil.techsOptParse)
        .opt()
            .name('outputDir').short('o').long('output-dir')
            .title('директория для записи результата, по умолчанию текущая')
            .def(process.cwd())
            .validate(function (d) { return myPath.join(d, '/') })
            .end()
        .opt()
            .name('level').short('l').long('level')
            .title('"прототип"')
            .end()
        .arg()
            .name('names')
            .title('имена')
            .required()
            .push()
            .end()
        .act(function(opts, args) {
            var _this = this;
            args.names.forEach(function(name){
                var dir = myPath.join(opts.outputDir, name);
                try {
                    var stat = fs.statSync(dir)
                    if (stat && stat.isDirectory())
                        _this.errorExit('Пропущено "' + name + '": уже существует ' + dir);
                } catch(ignore) {}

                fs.mkdirSync(dir, 0777);

                var proto, protoPath;
                if (opts.level) {
                    try {
                        proto = require(protoPath = 'bem/levels/' + opts.level);
                    } catch (ignore) {
                        try {
                            proto = require(protoPath = myPath.absolute(opts.level));
                        } catch (ignore) {
                            sys.error('Прототип уровня переопределения "' + opts.level + '" не найден');
                        }
                    }
                }

                if (proto || opts.addTech || opts.forceTech) {
                    var bemDir = myPath.join(dir, '.bem'),
                        levelFile = myPath.join(bemDir, 'level.js'),
                        content = '';
                    fs.mkdirSync(bemDir, 0777);

                    proto && (content += 'var level = require(\'' +
                            (myPath.isAbsolute(protoPath)? myPath.relative(levelFile, protoPath) : protoPath) + '\');\n' +
                        'for (var n in level) exports[n] = level[n];\n');

                    opts.forceTech && (content += 'exports.techs = {\n' +
                        opts.forceTech.map(function(t) {
                            var tech = new Tech(t);
                            return "    '" + tech.getTechName() + "': '" + tech.getTechRelativePath(bemDir) + "'";
                        }).join(',\n') + '\n};\n');

                    opts.addTech && opts.noTech && (content += 'exports.techs = exports.techs || {};\n' +
                        opts.addTech.map(function(t, i) {
                            var tech = new Tech(t);
                            return "exports.techs['" + tech.getTechName() + "'] = '" + tech.getTechRelativePath(bemDir) + "';"; }).join('\n') +
                        '\n' +
                        opts.noTech.map(function(t, i) {
                            var tech = new Tech(t);
                            return "delete exports.techs['" + tech.getTechName() + "'];"; }).join('\n') +
                        '\n');

                    fs.createWriteStream(levelFile, { encoding: 'utf8' }).write(content);
                }
            });
        })

};
