var path = require('path');

exports.techsOptParse = function () {
    return this
        .opt()
            .name('addTech').short('t').long('add-tech')
            .title('добавить технологию')
            .push()
            .end()
        .opt()
            .name('forceTech').short('T').long('force-tech')
            .title('использовать только эту технологию')
            .push()
            .end()
        .opt()
            .name('noTech').short('n').long('no-tech')
            .title('исключить технологию из использования')
            .push()
            .end()
};

exports.levelOptParse = function() {
    return this.opt()
        .name('levelDir').short('l').long('level')
        .title('директория уровня переопределения, по умолчанию текущая')
        .def(process.cwd())
        .validate(function (d) { return path.join(d, '/') })
        .end();
};

exports.mergeTechs = function (level, opts) {
    // NOTE: если при создании блока/элемента/модификатора
    // указали --force-tech <name> или --no-tech, и в level.js
    // определена технология с таким именем/файлом на диске,
    // нужно использовать именно её
    var techs = opts.forceTech? {} : level.techs,
        optsTechs = [];

    opts.forceTech && optsTechs.push.apply(optsTechs, opts.forceTech);
    opts.addTech && optsTechs.push.apply(optsTechs, opts.addTech);

    optsTechs.forEach(function(t) {
        var tech = level.getTech(t),
            name = tech.getTechName();
        techs[name] || (techs[name] = tech);
    });

    opts.noTech && opts.noTech.forEach(function(t) {
        delete techs[level.getTech(t).getTechName()];
    });

    return techs;
};

exports.isEmptyObject = function(obj) {
    for(var i in obj) return false;
    return true;
};
