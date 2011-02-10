var myPath = require('./path'),
    fs = require('fs');

exports.chdirOptParse = function() {
    return this.opt()
        .name('dir').short('C').long('chdir')
        .title('рабочая директория, по умолчанию текущая')
        .def(process.cwd())
        .validate(function(d) {
            d = myPath.join(d, '/');
            process.chdir(d);
            return d;
        })
        .end();
};

exports.techsOptParse = function() {
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
        .validate(function(d) { return myPath.join(d, '/') })
        .end();
};

exports.mergeTechs = function(level, opts) {
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

exports.mkdir = function(path) {
    try { fs.mkdirSync(path, 0777) } catch(ignore) {}
};

exports.isFile = function(path) {
    try {
        return fs.statSync(path).isFile();
    } catch(ignore) {}
    return false;
};

exports.isDirectory = function(path) {
    try {
        return fs.statSync(path).isDirectory();
    } catch(ignore) {}
    return false;
};

exports.fsWalkTree = function(root, fileCb, filterCb) {
    var files = fs.readdirSync(root);
    while (files.length > 0) {
        var path = myPath.join(root, files.shift());
        if(filterCb && !filterCb(path)) continue;
        fileCb(path);
        if(exports.isDirectory(path)) exports.fsWalkTree(path, fileCb, filterCb);
    }
};

exports.getDirs = function(path) {
    try {
        return exports.isDirectory(path)?
            fs.readdirSync(path)
                .filter(function(d) {
                    return !(/^\.svn$/.test(d)) && exports.isDirectory(myPath.join(path, d));
                })
                .sort() :
            [];
    } catch (e) {
        return [];
    }
};

exports.getFiles = function(path) {
    try {
        return exports.isDirectory(path)?
            fs.readdirSync(path)
                .filter(function(f) {
                    return exports.isFile(myPath.join(path, f));
                })
                .sort() :
            [];
    } catch (e) {
        return [];
    }
};

exports.isEmptyObject = function(obj) {
    for(var i in obj) return false;
    return true;
};

exports.isRequireError = function(e) {
    return /^Cannot find module/.test(e.message);
};

exports.isPath = function(str) {
    return str.indexOf('/') !== -1;
};

exports.isRequireable = function(path) {
    try {
        require(path);
        return true;
    } catch (e) {
        if(! isRequireError(e)) throw e;
        return false;
    }
};

exports.arrayUnique = function(arr) {
    return arr.reduce(function(prev, cur) {
        if(prev.indexOf(cur) + 1) return prev;
        return prev.concat([cur]);
    }, []);
};

exports.getBemTechPath = function(name) {
    var bemTechs = 'bem/techs',
        path = myPath.join(bemTechs, name);
    if(isRequireable(path)) {
        return path;
    }
    return myPath.join(bemTechs, 'default');
};

exports.mergeDecls = function mergeDecls(d1, d2) {
    d1 || (d1 = []);
    var keys = {};
    d1.forEach(function(o){ keys[o.name || o] = o });

    d2.forEach(function(o2){
        if (keys.hasOwnProperty(o2.name || o2)) {
            var o1 = keys[o2.name || o2];
            o2.elems && (o1.elems = mergeDecls(o1.elems, o2.elems));
            o2.mods && (o1.mods = mergeDecls(o1.mods, o2.mods));
            o2.vals && (o1.vals = mergeDecls(o1.vals, o2.vals));
        } else {
            d1.push(o2);
        }
    });

    return d1;
};
