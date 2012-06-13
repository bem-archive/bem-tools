var Q = require('q'),
    QFS = require('q-fs'),
    PATH = require('./path'),
    FS = require('fs'),
    VM = require('vm'),
    ENV = require('./env');

exports.chdirOptParse = function() {
    return this.opt()
        .name('dir').short('C').long('chdir')
        .title('working directory, cwd by default')
        .def(process.cwd())
        .val(function(d) {
            return PATH.join(PATH.resolve(d), PATH.dirSep);
        })
        .act(function(opts) {
            process.chdir(opts.dir);
        })
        .end();
};

exports.techsOptParse = function() {
    return this
        .opt()
            .name('addTech').short('t').long('add-tech')
            .title('add tech')
            .arr()
            .end()
        .opt()
            .name('forceTech').short('T').long('force-tech')
            .title('use only specified tech')
            .arr()
            .end()
        .opt()
            .name('noTech').short('n').long('no-tech')
            .title('exclude tech')
            .arr()
            .end()
};

exports.levelOptParse = function() {
    var def = exports.findLevel(process.cwd()),
        rel = PATH.relative(PATH.join(process.cwd(), PATH.dirSep), def);
    return this.opt()
        .name('level').short('l').long('level')
        .def(def)
        .title(['level directory path, default: ',
            !rel? '.' : rel, PATH.dirSep].join(''))
        .val(function(l) {
            return typeof l == 'string'? require('./level').createLevel(l) : l;
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
        return QFS.write(path, Array.isArray(content) ? content.join('') : content, { charset: 'utf8' });
    });
};

exports.writeFileIfDiffers = function(path, content) {
    return QFS.exists(path)
        .then(function(exists) {
            if (!exists) return true;
            return QFS.read(path, { charset: 'utf8' }).then(function(current) {
                    return current !== content;
                });
        })
        .then(function(rewrite) {
            if (rewrite) return exports.writeFile(path, content);
        });
};

exports.readFile = function(path) {
    return QFS.read(path, { charset: 'utf8' });
};

exports.readBinary = function(path) {
    return QFS.read(path, { charset: 'binary' });
};

/**
 * Read and parse declaration module-like file,
 * e.g. deps.js or bemdecl.js.
 *
 * @param {String} path  Path to declaration file.
 * @return {Promise * Object}  Declaration object.
 */
exports.readDecl = function(path) {
    return exports.readFile(path)
        .then(function(c) {
            var fn = VM.runInThisContext(declWrapper[0] + c + declWrapper[1], path),
                decl = {},
                module = { exports: decl };
            return fn(decl, module);
        })
        .fail(function() {
            return {};
        });
};

/**
 * Declaration modules content wrapper for `readDecl()`.
 *
 * @type {String}
 */
var declWrapper = ['(function(exports, module) {', ';return exports;})'];

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

exports.fsWalkTree = function(root, fileCb, filterCb, ctx) {
    var files = FS.readdirSync(root);
    files.sort();
    while (files.length > 0) {
        var path = PATH.join(root, files.shift());
        if(filterCb && !filterCb.call(ctx, path)) continue;
        fileCb.call(ctx, path);
        if(exports.isDirectory(path)) exports.fsWalkTree(path, fileCb, filterCb, ctx);
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

exports.getDirsAsync = function(path) {
    return QFS.list(path).then(function(items) {
        return Q.all(items.map(function(i) {
            return QFS.isDirectory(PATH.join(path, i))
                .then(function(isDir){
                    return {
                        name: i,
                        dir: isDir
                    };
                }
            );
        }))
        .then(function(items) {
                return items
                    .filter(function(item) {
                        return item.dir;
                    })
                    .map(function(item) {
                        return item.name;
                    });
            }
        );
    });
};

exports.getFilesAsync = function(path) {
    return QFS.list(path).then(function(items) {
        return Q.all(items.map(function(i) {
            return QFS.isFile(PATH.join(path, i))
                .then(function(isFile){
                    return {
                        name: i,
                        file: isFile
                    };
                }
            );
        }))
        .then(function(items) {
                return items
                    .filter(function(item) {
                        return item.file;
                    })
                    .map(function(item) {
                        return item.name;
                    });
            }
        );
    });
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

exports.toUpperCaseFirst = function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

exports.isEmptyObject = function(obj) {
    for(var i in obj) return false;
    return true;
};

exports.isRequireError = function(e) {
    return /^Cannot find module/.test(e.message);
};

exports.isPath = function(str) {
    return PATH.normalize(str).indexOf(PATH.dirSep) !== -1;
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

exports.requireWrapper = function(wrappedRequire) {
   var func = function(module, noCache) {
       if (noCache) delete wrappedRequire.cache[wrappedRequire.resolve(module)];
       return wrappedRequire(module);
   };

   ['resolve', 'cache', 'extensions', 'registerExtension'].forEach(function(key) {
       func[key] = wrappedRequire[key];
   });

   return func;
};

exports.removeFromArray = function(arr, o) {
    var i = arr.indexOf(o);
    return i >= 0 ?
        (arr.splice(i, 1), true) :
        false
};

var getNodePrefix = exports.getNodePrefix = function(level, item) {
    return PATH.join(
        PATH.relative(
            PATH.join(ENV.getEnv('root'), '/'),
            level.dir),
        level.getRelByObj(item));
};

exports.getNodeTechPath = function(level, item, tech) {
    return level.getPath(getNodePrefix(level, item), tech);
};

exports.setEnv = function(opts) {
    ENV.setEnv('root', opts.root);
    ENV.setEnv('verbose', opts.verbose);
    ENV.setEnv('force', opts.force);
};

exports.pad = function(n, desiredLength, padWith) {
    n = '' + n;
    if (n.length < desiredLength) n = new Array(desiredLength - n.length + 1).join(padWith) + n;

    return n;
};
