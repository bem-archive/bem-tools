var PATH = require('./path'),
    FS = require('fs');

exports.chdirOptParse = function() {
    return this.opt()
        .name('dir').short('C').long('chdir')
        .title('рабочая директория, по умолчанию текущая')
        .def(process.cwd())
        .val(function(d) {
            d = PATH.join(d, '/');
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
            .arr()
            .end()
        .opt()
            .name('forceTech').short('T').long('force-tech')
            .title('использовать только эту технологию')
            .arr()
            .end()
        .opt()
            .name('noTech').short('n').long('no-tech')
            .title('исключить технологию из использования')
            .arr()
            .end()
};

exports.levelOptParse = function() {
    var def = exports.findLevel(process.cwd()),
        rel = PATH.relative(PATH.join(process.cwd(), '/'), def);
    return this.opt()
        .name('levelDir').short('l').long('level')
        .def(def)
        .title(['директория уровня переопределения, по умолчанию: ',
            !rel? '.' : rel, '/'].join(''))
        .val(function(d) { return PATH.join(d, '/') })
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

exports.write = function(path, content) {
    FS.createWriteStream(path, { encoding: 'utf8' })
        .write(Array.isArray(content) ? content.join('') : content);
};

exports.mkdir = function(path) {
    try { FS.mkdirSync(path, 0777) } catch(ignore) {}
};

exports.mkdirs = function(path) {
    if (PATH.existsSync(path)) return;
    exports.mkdirs(PATH.dirname(path));
    exports.mkdir(path);
};

exports.isFile = function(path) {
    try {
        return FS.statSync(path).isFile();
    } catch(ignore) {}
    return false;
};

exports.isDirectory = function(path) {
    try {
        return FS.statSync(path).isDirectory();
    } catch(ignore) {}
    return false;
};

exports.isLevel = function(path) {
    return exports.isDirectory(path) &&
        exports.isFile(PATH.join(path, '.bem/level.js'));
};

exports.findLevel = function(path, startPath) {
    startPath = startPath || path;
    if (exports.isLevel(path)) return path;
    if (path == '/') return startPath;
    return exports.findLevel(PATH.dirname(path), startPath);
};

exports.fsWalkTree = function(root, fileCb, filterCb) {
    var files = FS.readdirSync(root);
    files.sort();
    while (files.length > 0) {
        var path = PATH.join(root, files.shift());
        if(filterCb && !filterCb(path)) continue;
        fileCb(path);
        if(exports.isDirectory(path)) exports.fsWalkTree(path, fileCb, filterCb);
    }
};

exports.getDirs = function(path) {
    try {
        return exports.isDirectory(path)?
            FS.readdirSync(path)
                .filter(function(d) {
                    return !(/^\.svn$/.test(d)) && exports.isDirectory(PATH.join(path, d));
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
            FS.readdirSync(path)
                .filter(function(f) {
                    return exports.isFile(PATH.join(path, f));
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
        require.resolve(path);
        return true;
    } catch (e) {
        if(! exports.isRequireError(e)) throw e;
        return false;
    }
};

exports.arrayUnique = function(arr) {
    return arr.reduce(function(prev, cur) {
        if(prev.indexOf(cur) + 1) return prev;
        return prev.concat([cur]);
    }, []);
};

exports.arrayReverse = function(arr) {
    return arr.reduceRight(function(prev, cur) {
        prev.push(cur);
        return prev;
    }, []);
};

exports.getBemTechPath = function(name) {
    var bemTechs = 'bem/lib/techs',
        path = PATH.join(bemTechs, name);
    if(exports.isRequireable(path)) {
        return path;
    }
    return 'bem/lib/tech';
};

exports.stripModuleExt = function(path) {
    var exts = Object.keys(require.extensions).map(function(v) {
        return v.replace(/^\./, '');
    });
    return path.replace(new RegExp('\\.(' + exts.join('|') + ')$'), '');
};

exports.getNodePaths = function() {
    return (process.env.NODE_PATH || '').split(process.platform === 'windows' ? ';' : ':');
};

exports.mergeDecls = function mergeDecls(d1, d2) {
    var keys = {};
    d1?
        d1.forEach(function(o) { keys[o.name || o] = o }) :
        d1 = [];

    d2.forEach(function(o2) {
        var name = o2.name || o2;
        if (keys.hasOwnProperty(name)) {
            var o1 = keys[name];
            o2.elems && (o1.elems = mergeDecls(o1.elems, o2.elems));
            o2.mods && (o1.mods = mergeDecls(o1.mods, o2.mods));
            o2.vals && (o1.vals = mergeDecls(o1.vals, o2.vals));
            o2.techs && (o1.techs = mergeDecls(o1.techs, o2.techs));
        } else {
            d1.push(o2);
            keys[name] = o2;
        }
    });

    return d1;
};
