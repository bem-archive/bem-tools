var ASSERT = require('assert'),
    Q = require('q'),
    QFS = require('q-fs'),
    PATH = require('./path'),
    FS = require('fs'),
    VM = require('vm'),
    UTIL = require('util'),
    ENV = require('./env'),
    MKDIRP = require('mkdirp'),
    _ = require('underscore');

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
            .end()
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
            return QFS.symbolicLink(link, target);
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
 * Read and parse module-like file (declaration or other),
 * e.g. deps.js or bemdecl.js.
 *
 * @param {String} path  Path to declaration file.
 * @return {Promise * Object}  Declaration object.
 */
exports.readDecl = function(path) {

    path = PATH.resolve(path);

    return exports.readFile(path)
        .then(function(c) {

            var fn = VM.runInThisContext(declWrapper[0] + c + declWrapper[1], path),
                decl = {},
                module = { exports: decl };

            return fn(decl, exports.getRequireFunc(path), module, path, PATH.dirname(path));

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
exports.mkdirp = Q.nbind(MKDIRP);

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
 * Checks if `target` file is valid comparing it's mtime
 * with all then `depends` files.
 *
 * @param {String} target  Path to file to check validity status.
 * @param {String[]|String} depends  Target file dependencies to compare mtime to.
 * @return {Boolean}
 */
exports.isFileValid = function(target, depends) {

    Array.isArray(depends) || (depends = [depends]);
    return Q.all([
            QFS.lastModified(target)
                .fail(function() {
                    return -1;
                }),
            Q.all(depends.map(QFS.lastModified.bind(QFS)))
        ])
        .spread(exports.isTimeValid);

};

/**
 * Checks if `target` if the largest number among `depends`.
 *
 * Useful to compare timestamps.
 *
 * @param {Number} target
 * @param {Number[]|Number} depends
 * @return {Boolean}
 */
exports.isTimeValid = function(target, depends) {
    Array.isArray(depends) || (depends = [depends]);
    return target >= Math.max.apply(Math, depends);
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
        if(!fileCb.call(ctx, path) && exports.isDirectory(path)) exports.fsWalkTree(path, fileCb, filterCb, ctx);
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

    var bemLib = process.env.COVER? 'bem/lib-cov/' : 'bem/lib/';
        bemTechs = PATH.unixToOs(bemLib + 'techs'),
        path = PATH.join(bemTechs, name);

    if(exports.isRequireable(path + '.js')) return path + '.js';
    if(exports.isRequireable(path)) return path;

    return PATH.unixToOs(bemLib + 'tech.js');

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
        '(?:\.' + bemItemRe + ')?$');

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

/**
 * Result of the uniq() can be used as a callback to [].reduce().
 *
 * @param {Function} keyFunc  Function to calculate key.
 * @param {Object} thisp  Context of the `keyFunc`.
 * @return {Function}  Callback function.
 */
exports.uniq = function(keyFunc, thisp) {

    return function(val, cur, i, arr) {

        if (i === 0) val = { arr: val || [], keys: [] };

        var key = keyFunc? keyFunc.call(thisp, cur) : cur;
        if (!~val.keys.indexOf(key)) {
            val.keys.push(key);
            val.arr.push(cur);
        }

        return (i + 1 !== arr.length)? val : val.arr;

    }

};

// Use ported jQuery.extend() from `node.extend` module
exports.extend = require('node.extend');

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

/**
 * Executes specified command with options.
 *
 * @param {String} cmd  Command to execute.
 * @param {Object} [options]  Options to `child_process.exec()` function.
 * @param {Boolean} [resolveWithOutput]  Resolve returned promise with command output if true.
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

/**
 * True `require()` function constructor.
 *
 * The most of the code is derived from `lib/module.js` of NodeJS.
 *
 * @param {String} filename  Absolute filename of the base module.
 * @return {Function}  require() function.
 */
exports.getRequireFunc = function(filename) {

    // construct fake module object with useful context
    var Module = require('module'),
        newModule = new Module(filename, module),

        // construct require() function
        requireFunc = function(request) {
            return newModule.require(request);
        };

    // construct require.resolve() function
    requireFunc.resolve = function(request) {
        return Module._resolveFilename(request, newModule);
    };

    // set module filename for internal use
    newModule.filename = filename;

    // construct search module paths for require() and require.resolve()
    newModule.paths = Module._nodeModulePaths(PATH.dirname(filename));

    return requireFunc;

};
