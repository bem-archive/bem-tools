var bemUtil = require('../../util'),
    sys = require('sys'),
    fs = require('fs'),
    myPath = require('../../path'),
    Context = require('../../context').Context,
    Tech = require('../../tech').Tech;

exports.OptParse = function() {
    return this
        .title('Уровень переопределения.').helpful()
        .apply(bemUtil.chdirOptParse)
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
            var context = new Context(null, opts),
                _this = this;

            // FIXME: унести на уровень выше, например в обработку опций
            Tech.setContext(context);

            args.names.forEach(function(name) {
                var dir = myPath.join(opts.outputDir, name);
                bemUtil.isDirectory(dir)?
                    _this.errorExit('Пропущено "' + name + '": уже существует ' + dir) :
                    bemUtil.mkdir(dir);

                var proto, protoPath;
                if (opts.level) {
                    try {
                        proto = require(protoPath = 'bem/lib/levels/' + opts.level);
                    } catch (ignore) {
                        try {
                            proto = require(protoPath = myPath.absolute(opts.level));
                        } catch (ignore) {
                            sys.error('Прототип уровня переопределения "' + opts.level + '" не найден');
                        }
                    }
                }

                if (proto || context.opts.addTech || context.opts.forceTech) {
                    var bemDir = myPath.join(dir, '.bem'),
                        levelFile = myPath.join(bemDir, 'level.js'),
                        content = [];

                    bemUtil.mkdir(bemDir);

                    proto && content.push('var level = require(\'' +
                            (myPath.isAbsolute(protoPath)? myPath.relative(levelFile, protoPath) : protoPath) + '\');',
                        'for (var n in level) exports[n] = level[n];');

                    context.opts.forceTech && content.push('exports.techs = {',
                        context.opts.forceTech.map(function(t) {
                            var tech = context.getTech(t);
                            return "    '" + tech.getTechName() + "': '" + tech.getTechRelativePath(bemDir) + "'";
                        }).join(',\n'), '};');

                    (context.opts.addTech || context.opts.noTech) && content.push('exports.techs = exports.techs || {};');

                    context.opts.addTech && context.opts.addTech.forEach(function(t) {
                        var tech = context.getTech(t);
                        content.push("exports.techs['" + tech.getTechName() + "'] = '" + tech.getTechRelativePath(bemDir) + "';") })

                    context.opts.noTech && context.opts.noTech.forEach(function(t) {
                        content.push("delete exports.techs['" + (context.getTech(t)).getTechName() + "'];") });

                    fs.createWriteStream(levelFile, { encoding: 'utf8' }).write(content.join('\n'));
                }
            });
        })

};
