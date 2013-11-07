/* global toString: false */
'use strict';

var ASSERT = require('assert'),
    Q = require('q'),
    QFS = require('q-io/fs'),
    PATH = require('./path'),
    FS = require('fs'),
    VM = require('vm'),
    UTIL = require('util'),
    ENV = require('./env'),
    MKDIRP = require('mkdirp'),
    _ = require('lodash/dist/lodash.underscore');

exports.nodeVer = process.version.substr(1)
    .split('.')
    .map(function(v) {
        return parseInt(v, 10);
    });

exports.oldNode = exports.nodeVer[0] === 0 && exports.nodeVer[1] < 10;

exports.chdirOptParse = function() {
    return this.opt()
        .name('dir').short('C').long('chdir')
        .title('change process working directory, cwd by default; to specify level use --level, -l option instead')
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
            .end();
};

exports.levelOptParse = function() {
    var def = exports.findLevel(process.cwd()),
        rel = PATH.relative(process.cwd(), def);
    return this.opt()
        .name('level').short('l').long('level')
        .def(def)
        .title(['level directory path, default: ',
            !rel? '.' : rel, PATH.dirSep].join(''))
        .val(function(l) {
            return typeof l === 'string'? require('./level').createLevel(l) : l;
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

/**
 * Create symbolic link.
 *
 * If `force` is specified and is true, it will check
 * for `link` to exist and remove it in case it is
 * a symbolic link.
 *
 * Files and directories will be left untouched.
 *
 * @param {String} link  Symbolic link name.
 * @param {String} target  Symbolic link target.
 * @param {Boolean} [force]  Force creating symplink in case it is already exist.
 * @return {Promise * Undefined}
 */
exports.symbolicLink = function(link, target, force) {

    return Q.resolve(force)
        .then(function(force) {

            if (!force) return;

            return QFS.statLink(link)
                .then(function(stat) {
                    if (stat.isSymbolicLink()) {
                        return QFS.remove(link);
                    }
                })
                .fail(function() {});

        })
        .then(function() {
            // TODO: pass correct type based on target? (Windows)
            return QFS.symbolicLink(link, target, 'file');
        });

};

/**
 * Remove path (file or directory) but not recursively.
 *
 * @param {String} path  Path to remove
 * @return {Promise * Undefined}
 */
exports.removePath = function(path) {

    return QFS.stat(path)
        .then(function(stat) {

            if (stat.isDirectory()) return QFS.removeDirectory(path);
            return QFS.remove(path);

        });

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
            return exports.readFile(path)
                .then(function(current) {
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
            return fn(decl, require, module, PATH.resolve(path), PATH.resolve(PATH.dirname(path)));
        });
};

/**
 * Declaration modules content wrapper for `readDecl()`.
 *
 * @type {String[]}
 */
var declWrapper = ['(function(exports, require, module, __filename, __dirname) {', ';return module.exports;})'];

/**
 * Read and parse JSON-JS file.
 *
 * @param {String} path  Path to file to read.
 * @return {Promise * Object|Array}  Data read from file.
 */
exports.readJsonJs = function(path) {
    return exports.readFile(path)
        .then(function(c) {
            return VM.runInThisContext(c, path);
        });
};

exports.mkdir = function(path) {
    try {
        FS.mkdirSync(path, '0777');
    } catch(ignore) {}
};

/**
 * Create directories.
 *
 * @return {String}  First directory being created.
 */
exports.mkdirs = MKDIRP.sync;

/**
 * Create directories.
 *
 * @return {Promise * String}  First directory being created.
 */
exports.mkdirp = Q.nfbind(MKDIRP);

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

/** @deprecated */
exports.isFileP = QFS.isFile.bind(QFS);

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

/**
 * Search for the nearest level recursivelt from the specified
 * directory to the filesystem root.
 *
 * @param {String} path  Path to start search from.
 * @param {String[]|String|Undefined} [types]  Level type to search.
 * @param {String} [startPath]
 * @return {String}  Found level path or specified path if not found.
 */
exports.findLevel = function(path, types, startPath) {

    var createLevel = require('./level').createLevel;

    if (types && !Array.isArray(types)) types = [types];
    startPath = startPath || path;

    // Check for level and level type if applicable
    if (exports.isLevel(path) &&
        (!types || exports.containsAll(createLevel(path).getTypes(), types))) return path;

    // Check for fs root
    if (PATH.isRoot(path)) return startPath;

    return exports.findLevel(PATH.dirname(path), types, startPath);

};

/**
 * Filter out non-existent paths.
 *
 * @param {String[]} paths  Paths to filter
 * @return {Promise * String[]}  Existent paths
 */
exports.filterPaths = function(paths) {

    var d = Q.defer(),
        res = [],
        total = paths.length,
        count = 0;

    paths.forEach(function(path, index) {

        PATH.exists(path, function(exists) {

            count++;
            res[index] = exists;

            if (count < total) return;

            d.resolve(paths.filter(function(path, index) {
                return res[index];
            }));

        });

    });

    return d.promise;

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

exports.fsWalkTreeAsync = function(root, fileCb, filterCb, ctx) {
    return QFS.list(root)
        .then(function(files) {
            return Q.all(files.map(function(file) {
                var path = PATH.join(root, file);
                if (!(filterCb && !filterCb.call(ctx, path, file))) {
                    //fileCb.call(ctx, path);
                    return QFS.isDirectory(path)
                        .then(function(isdir) {
                            if (isdir) return exports.fsWalkTreeAsync(path, fileCb, filterCb, ctx);
                        });
                }
            }));
        });
};

exports.fsWalkTreeCb = function(root, fileCb) {

    var d = Q.defer(),
        results = {};

    function done(err) {
        if (err) d.reject(err);
        d.resolve(results);
    }

    if (root[root.length-1] !== PATH.dirSep) root += PATH.dirSep;

    walk(root, '', done);

    function walk(path, relPath, cb) {
        FS.readdir(path, function(err, list) {

            if (err) return done(err);
            var pending = list.length;
            if (!pending) return cb(null, results);

            list.forEach(function(file) {
                var absPath = PATH.join(path, file);

                FS.stat(absPath, function(err, stat) {
                    if (err) return done(err);

                    if (file[0] !== '.') {
                        if (stat && stat.isDirectory()) {
                            walk(absPath, PATH.join(relPath, file), function() {
                                if (!--pending) cb(null, results);
                            });

                            return;
                        }

                        var f = PATH.join(relPath, file);

                        process.nextTick(fileCb.bind(fileCb, {
                            file: file,
                            relPath: f,
                            absPath: absPath,
                            lastUpdated: stat.mtime.getTime()
                        }));
                    }

                    if (!--pending) cb(null, results);
                });
            });
        });

    }
    return d.promise;
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

/* jshint -W098 */
exports.isEmptyObject = function(obj) {
    for(var i in obj) return false;
    return true;
};
/* jshint +W098 */

var errRe = /^Cannot find module/;
exports.isRequireError = function(e) {
    return errRe.test(e.message);
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

exports.getBemTechPath = function(name, opts) {
    opts = _.defaults(opts || {}, {
        throwWhenUnresolved: false,
    });

    var bemLib = process.env.COVER? 'bem/lib-cov/' : 'bem/lib/',
        v1Path = PATH.join(bemLib, 'techs', name),
        v2Path = PATH.join(bemLib, 'techs', 'v2', name),
        paths;

    if (typeof opts.version === 'undefined') {
        paths = [
            v1Path,
            v2Path
        ];
    } else if (opts.version === 1) {
        paths = [
            v1Path
        ];
    } else {
        paths = [
            v2Path
        ];
    }

    for (var i=0, path; path = paths[i]; i++) {
        if(exports.isRequireable(path + '.js')) return path + '.js';
        if(exports.isRequireable(path)) return path;
    }

    if (!opts.throwWhenUnresolved) return PATH.join(bemLib, 'tech');

    throw new Error('Unable to resolve "' + name + '" tech');
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
        d1.forEach(function(o) {
            keys[o.name || o] = o;
        }) :
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
 * Constructs BEM entity key from entity properties.
 *
 * @param {Object} item  BEM entity object.
 * @param {String} item.block  Block name.
 * @param {String} [item.elem]  Element name.
 * @param {String} [item.mod]  Modifier name.
 * @param {String} [item.val]  Modifier value.
 * @return {String}
 */
exports.bemKey = function(item) {

    var key = '';

    if (item.block) {
        key += item.block;

        item.elem && (key += '__' + item.elem);

        if (item.mod) {
            key += '_' + item.mod;
            item.val && (key += '_' + item.val);
        }
    }

    return key;

};

/**
 * Constructs BEM entity full key from entity properties plus tech name.
 *
 * @param {Object} item  BEM entity object.
 * @param {String} item.block  Block name.
 * @param {String} [item.elem]  Element name.
 * @param {String} [item.mod]  Modifier name.
 * @param {String} [item.val]  Modifier value.
 * @param {String} [item.tech]  Tech name.
 * @return {String}
 */
exports.bemFullKey = function(item) {
    return exports.bemKey(item) + (item.tech? '.' + item.tech : '');
};

/**
 * Return BEM entity type by describing object.
 *
 * @param {Object} item  BEM entity object.
 * @param {String} item.block  Block name.
 * @param {String} [item.elem]  Element name.
 * @param {String} [item.mod]  Modifier name.
 * @param {String} [item.val]  Modifier value.
 * @return {String}
 */
exports.bemType = function(item) {

    var type = item.elem? 'elem' : 'block';

    if (item.mod) {
        type += '-mod';
        item.val && (type += '-val');
    }

    return type;

};

var bemItemRe = '([^_.]+)',
    bemKeyRe = new RegExp('^' + bemItemRe +
        '(?:__' + bemItemRe + ')?(?:_' + bemItemRe + '(?:_' + bemItemRe + ')?)?' +
        '(?:\\.([^_]+))?$');

/**
 * Parse BEM-entity key into BEM-entity object.
 *
 * @param {String} key  Key to parse.
 * @return {Object}  BEM-entity object.
 */
exports.bemParseKey = function(key) {

    var m = bemKeyRe.exec(key),
        item = { block: m[1] };

    m[2] && (item.elem = m[2]);
    m[3] && (item.mod = m[3]);
    m[4] && (item.val = m[4]);
    m[5] && (item.tech = m[5]);

    return item;

};

/* jshint -W106 */
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
    if (typeof target !== 'object' && typeof target !== 'function')
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
/* jshint +W106 */

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
        false;
};

/**
 * Return true if all of `needles` are found in `arr`.
 *
 * @param {Array} arr  Array to search.
 * @param {String[]|String} needles  Needles to search.
 * @return {Boolean}
 */
exports.containsAll = function(arr, needles) {

    Array.isArray(needles) || (needles = [needles]);

    return _.all(needles, function(i) {
        return _.contains(arr, i);
    });

};

var getNodePrefix = exports.getNodePrefix = function(level, item) {
    return PATH.join(
        PATH.relative(ENV.getEnv('root'), level.dir),
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

exports.pad = exports.lpad = function(n, desiredLength, padWith) {
    n = '' + n;
    if (n.length < desiredLength) n = new Array(desiredLength - n.length + 1).join(padWith) + n;

    return n;
};

/**
 * Implementation `rsplit` from Python.
 *
 * See http://docs.python.org/library/stdtypes.html#str.rsplit
 *
 * @param {String} string  String to split
 * @param {String} [sep]  Separator
 * @param {Number} [maxsplit]  Max chunks
 *
 * @return {Array}
 */
exports.rsplit = function(string, sep, maxsplit) {
    var arr = string.split(sep || /s+/);
    return maxsplit ? [arr.slice(0, -maxsplit).join(sep)].concat(arr.slice(-maxsplit)) : arr;
};

exports.snapshotArch = function(arch, filename) {
    ASSERT.ok(arch, 'argument is not an object');
    ASSERT.ok(filename, 'string is expected');
    ASSERT.ok(arch.toJson, 'object has no toJson method');

    var path = PATH.dirname(filename);

    return QFS.exists(path)
        .then(function(exists) {
            if (!exists) return QFS.makeDirectory(path);
        })
        .then(function() {
            return exports.writeFile(filename, arch.toJson());
        });
};

exports.getDirsFiles = function(path, dirs, files) {
    return QFS.list(path).then(function(list) {
        return Q.all(list
            .map(function(i) {
                return QFS.isDirectory(PATH.join(path, i))
                    .then(function(isDir) {
                        (isDir ? dirs : files).push(i);
                    });
            }));
    });
};

exports.getDirsFilesSync = function(path, dirs, files) {

    var items = FS.readdirSync(path);

    items.forEach(function(item) {

        if (item[0] === '.') return;

        var stat = FS.lstatSync(path + PATH.dirSep + item),
            file = {
                file: item,
                absPath: path + PATH.dirSep + item,
                lastUpdated: stat.mtime.getTime()
            };

        if (stat.isDirectory()) dirs && dirs.push(file);
        else files && files.push(file);
    });
};

/**
 * Executes specified command with options.
 *
 * @param {String} cmd  Command to execute.
 * @param {Object} options  Options to `child_process.exec()` function.
 * @param {Boolean} resolveWithOutput  Resolve returned promise with command output if true.
 * @return {Promise * String | Undefined}
 */
exports.exec = function(cmd, options, resolveWithOutput) {

    var cp = require('child_process').exec(cmd, options),
        d = Q.defer(),
        output = '';

    cp.on('exit', function(code) {
        if (code === 0) return d.resolve(resolveWithOutput && output ? output : null);
        d.reject(new Error(UTIL.format('%s failed: %s', cmd, output)));
    });

    cp.stderr.on('data', function(data) {
        output += data;
    });

    cp.stdout.on('data', function(data) {
        output += data;
    });

    return d.promise;

};

var os = require('os'),
    hits = {};

/**
 * Output deprecate message only once based on the value of
 * the `methodName` argument.
 *
 * Based on the code of `deprecate` module:
 * https://github.com/brianc/node-deprecate
 *
 * @type {Function}
 * @param {String} methodName
 * @param {String} message
 */
var deprecate = exports.deprecate = function(methodName, message) {
    if (deprecate.silence) return;
    if (hits[methodName]) return;

    hits[methodName] = true;

    deprecate.stream.write(os.EOL);

    if (deprecate.color) {
        deprecate.stream.write(deprecate.color);
    }

    deprecate.stream.write('WARNING!' + os.EOL);

    for (var i = 0; i < arguments.length; i++) {
        deprecate.stream.write(arguments[i] + os.EOL);
    }

    if (deprecate.color) {
        deprecate.stream.write('\x1b[0m');
    }

    deprecate.stream.write(os.EOL);
};

deprecate.stream = process.stderr;
deprecate.silence = !!process.env.BEM_NO_DEPRECATION;
deprecate.color = '\x1b[31;1m';
