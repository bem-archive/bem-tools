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
                bemUtil.isDirectory(dir)?
                    _this.errorExit('Пропущено "' + name + '": уже существует ' + dir) :
                    bemUtil.mkdir(dir);

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
                        content = [];

                    bemUtil.mkdir(bemDir);

                    proto && content.push('var level = require(\'' +
                            (myPath.isAbsolute(protoPath)? myPath.relative(levelFile, protoPath) : protoPath) + '\');',
                        'for (var n in level) exports[n] = level[n];');

                    opts.forceTech && content.push('exports.techs = {',
                        opts.forceTech.map(function(t) {
                            var tech = new Tech(t);
                            return "    '" + tech.getTechName() + "': '" + tech.getTechRelativePath(bemDir) + "'";
                        }).join(',\n'), '};');

                    (opts.addTech || opts.noTech) && content.push('exports.techs = exports.techs || {};');

                    opts.addTech && opts.addTech.forEach(function(t) {
                        var tech = new Tech(t);
                        content.push("exports.techs['" + tech.getTechName() + "'] = '" + tech.getTechRelativePath(bemDir) + "';") })

                    opts.noTech && opts.noTech.forEach(function(t) {
                        content.push("delete exports.techs['" + (new Tech(t)).getTechName() + "'];") });

                    fs.createWriteStream(levelFile, { encoding: 'utf8' }).write(content.join('\n'));
                }
            });
        })

};
