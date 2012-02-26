var Q = require('q'),
    QW = require('q-wrap'),
    PATH = require('./path'),
    FS = require('fs');

exports.chdirOptParse = function() {
    return this.opt()
        .name('dir').short('C').long('chdir')
        .title('рабочая директория, по умолчанию текущая')
        .def(process.cwd())
        .val(function(d) {
            d = PATH.join(d, PATH.dirSep);
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
        rel = PATH.relative(PATH.join(process.cwd(), PATH.dirSep), def);
    return this.opt()
        .name('level').short('l').long('level')
        .def(def)
        .title(['директория уровня переопределения, по умолчанию: ',
            !rel? '.' : rel, PATH.dirSep].join(''))
        .val(function(l) {
            return typeof l == 'string'? require('./bem').createLevel(l) : l;
        })
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
    FS.writeFileSync(path, Array.isArray(content) ? content.join('') : content);
};

exports.writeFile = function(path, content) {
    return Q.when(content, function(content) {
        return QW.execute(FS.writeFile, path, Array.isArray(content) ? content.join('') : content, 'utf8');
    });
};

exports.readFile = function(path) {
    return QW.execute(FS.readFile, path, 'utf8');
};

exports.mkdir = function(path) {
    try { FS.mkdirSync(path, 0777) } catch(ignore) {}
};

exports.mkdirs = function(path) {
    if (PATH.existsSync(path)) return;
    exports.mkdirs(PATH.dirname(path));
    exports.mkdir(path);
};

exports.isExists = function(path) {
    var d = Q.defer();
    PATH.exists(path, function(res) {
        d.resolve(res);
    });
    return d.promise;
};

exports.isFile = function(path) {
    try {
        return FS.statSync(path).isFile();
    } catch(ignore) {}
    return false;
};

exports.isFileP = function(path) {
    return Q.when(QW.execute(FS.stat, path),
        function(stat) {
            return stat.isFile();
        },
        function(err) {
            return false;
        });
};

exports.isDirectory = function(path) {
    try {
        return FS.statSync(path).isDirectory();
    } catch(ignore) {}
    return false;
};

exports.isLevel = function(path) {
    return exports.isDirectory(path) &&
        exports.isFile(PATH.join(path, '.bem', 'level.js'));
};

exports.findLevel = function(path, startPath) {
    startPath = startPath || path;
    if (exports.isLevel(path)) return path;
    if (PATH.isRoot(path)) return startPath;
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
    return str.indexOf(PATH.dirSep) !== -1;
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
    var bemTechs = PATH.unixToOs('bem/lib/techs'),
        path = PATH.join(bemTechs, name);
    if(exports.isRequireable(path)) {
        return path;
    }
    return PATH.unixToOs('bem/lib/tech');
};

exports.stripModuleExt = function(path) {
    var exts = Object.keys(require.extensions).map(function(v) {
        return v.replace(/^\./, '');
    });
    return path.replace(new RegExp('\\.(' + exts.join('|') + ')$'), '');
};

exports.getNodePaths = function() {
    return (process.env.NODE_PATH || '').split(PATH.pathSep);
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

exports.declForEach = function(decl, cb) {

    var forItemWithMods = function(block, elem) {
            var item = elem || block,
                type = elem? 'elem' : 'block',
                args = elem? [block.name, elem.name] : [block.name];

            // for block and element
            cb(type, args, item);

            // for each modifier
            item.mods && item.mods.forEach(function(mod) {

                // for modifier
                cb(type + '-mod', args.concat(mod.name), mod);

                // for each modifier value
                mod.vals && mod.vals.forEach(function(val, i) {
                    if (!val.name) {
                        val = { name: val };
                        mod.vals[i] = val;
                    }
                    cb(type + '-mod-val', args.concat(mod.name, val.name), val);
                });

            });
        },
        forBlockDecl = function(block) {
            // for block
            forItemWithMods(block);

            // for each block element
            block.elems && block.elems.forEach(function(elem) {
                forItemWithMods(block, elem);
            });
        },
        forBlocksDecl = function(blocks) {
            // for each block in declaration
            blocks.forEach(forBlockDecl);
        };

    decl.name && forBlockDecl(decl);
    decl.blocks && forBlocksDecl(decl.blocks);

};

/**
 * Adopted from jquery's extend method. Under the terms of MIT License.
 *
 * http://code.jquery.com/jquery-1.4.2.js
 *
 * Modified by mscdex to use Array.isArray instead of the custom isArray method
 */
var extend = exports.extend = function() {
    // copy reference to target object
    var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options, name, src, copy;

    // Handle a deep copy situation
    if (typeof target === 'boolean') {
        deep = target;
        target = arguments[1] || {};
        // skip the boolean and the target
        i = 2;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if (typeof target !== 'object' && !typeof target === 'function')
        target = {};

    var isPlainObject = function(obj) {
        // Must be an Object.
        // Because of IE, we also have to check the presence of the constructor property.
        // Make sure that DOM nodes and window objects don't pass through, as well
        if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval)
            return false;

        var has_own_constructor = hasOwnProperty.call(obj, 'constructor');
        var has_is_property_of_method = hasOwnProperty.call(obj.constructor.prototype, 'isPrototypeOf');
        // Not own constructor property must be Object
        if (obj.constructor && !has_own_constructor && !has_is_property_of_method)
            return false;

        // Own properties are enumerated firstly, so to speed up,
        // if last one is own, then all properties are own.

        var key, last_key;
        for (key in obj)
            last_key = key;

        return typeof last_key === 'undefined' || hasOwnProperty.call(obj, last_key);
    };


    for (; i < length; i++) {
        // Only deal with non-null/undefined values
        if ((options = arguments[i]) !== null) {
            // Extend the base object
            for (name in options) {
                if (!options.hasOwnProperty(name))
                    continue;
                src = target[name];
                copy = options[name];

                // Prevent never-ending loop
                if (target === copy)
                    continue;

                // Recurse if we're merging object literal values or arrays
                if (deep && copy && (isPlainObject(copy) || Array.isArray(copy))) {
                    var clone = src && (isPlainObject(src) || Array.isArray(src)) ? src : Array.isArray(copy) ? [] : {};

                    // Never move original objects, clone them
                    target[name] = extend(deep, clone, copy);

                // Don't bring in undefined values
                } else if (typeof copy !== 'undefined')
                    target[name] = copy;
            }
        }
    }

    // Return the modified object
    return target;
};
