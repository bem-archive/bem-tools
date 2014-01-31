'use strict';

var Q = require('q'),
    FS = require('fs'),
    QFS = require('q-io/fs'),
    bemUtil = require('./../util'),
    _ = require('lodash/dist/lodash.underscore'),
    PATH = require('./../path'),
    INHERIT = require('inherit'),
    LOGGER = require('./../logger'),

    Tech = exports.Tech = INHERIT(/** @lends Tech.prototype */ {

        API_VER: 2,

        /**
         * Construct an instance of Tech.
         *
         * @class Tech base class
         * @constructs
         * @private
         * @param {String} name  Tech name.
         * @param {String} path  Tech module absolute path.
         */
        __constructor: function(name, path) {
            this.techName = name;
            this.techPath = path;
        },

        /**
         * Set context to use in tech module.
         *
         * @public
         * @param {Context} ctx  Context instance object.
         */
        setContext: function(ctx) {
            this.context = ctx;
            return this;
        },

        /**
         * Return context.
         *
         * @public
         * @returns {Context}  Context instance object.
         */
        getContext: function() {
            return this.context;
        },

        /**
         * Implementation of 'bem create block | elem | mod' commands.
         *
         * @param {Object}  item    BEM entity object.
         * @param {Object}  item.block  BEM entity block name.
         * @param {Object}  item.elem   BEM entity elem name.
         * @param {Object}  item.mod    BEM entity modifier name.
         * @param {Object}  item.val    BEM entity modifier value.
         * @param {Level}   level   Level instance object.
         * @param {Object}  opts    Additional options.
         * @returns {Promise * Undefined}
         */
        createByDecl: function(item, level, opts) {
            opts = opts || {};

            var prefix = level.getByObj(item),
                vars = {
                    opts: opts,
                    BlockName: item.block,
                    Prefix: prefix
                };

            if (item.elem) vars.ElemName = item.elem;
            if (item.mod) vars.ModName = item.mod;
            if (item.val) vars.ModVal = item.val;

            return this.create(prefix, vars, opts.force);
        },

        /**
         * Implementation of 'bem create block | elem | mod' commands.
         *
         * @public
         * @param {String}  prefix  Path prefix of object to create.
         * @param {Object}  vars    Variables to use in template.
         * @param {Boolean} force   Force creation flag.
         * @returns {Promise * Undefined}
         */
        create: function(prefix, vars, force) {
            return this.storeCreateResults(prefix, this.getCreateResults(prefix, vars), force);
        },

        /**
         * Return create result for one tech suffix.
         *
         * @protected
         * @param {String} path    Full path of object to create.
         * @param {String} suffix  Suffix of object to create.
         * @param {Object} vars    Variables to use in template.
         * @returns {Promise * String}
         */
        getCreateResult: function(path, suffix, vars) {
            return Q.resolve(vars.content || '');
        },

        /**
         * Return create result for all tech suffixes.
         *
         * @protected
         * @param {String}  prefix  Oath prefix of object to create.
         * @param {Object}  vars    Variables to use in template.
         * @returns {Promise * Object}
         */
        getCreateResults: function(prefix, vars) {
            var _this = this,
                res = {};

            return Q
                .all(this.getCreateSuffixes().map(function(suffix) {
                    return Q.when(_this.getCreateResult(_this.getPath(prefix, suffix), suffix, vars))
                        .then(function(r) {
                            res[suffix] = r;
                        });
                }))
                .then(function() {
                    return res;
                });
        },

        /**
         * Store result of object creation for one suffix.
         *
         * @protected
         * @param {String}  path    Full path of object to create.
         * @param {String}  suffix  Suffix of object to create.
         * @param {Object}  res     Result of object creation.
         * @param {Boolean} force   Force creation flag.
         * @returns {Promise * Undefined}
         */
        storeCreateResult: function(path, suffix, res, force) {
            return QFS.exists(path).then(function(exists) {
                if(exists && !force) {
                    return Q.reject("Already exists '" + path + "'");
                }
                // TODO: replace by promisy equivalent
                bemUtil.mkdirs(PATH.dirname(path));
                return bemUtil.writeFile(path, res);
            });
        },

        /**
         * Store results of object creation.
         *
         * @protected
         * @param {String}  prefix  Path prefix of object to create.
         * @param {Object}  res     Result of object creation.
         * @param {Boolean} force   Force creation flag.
         * @returns {Promise * Undefined}
         */
        storeCreateResults: function(prefix, res, force) {
            var _this = this;
            return Q.when(res, function(res) {
                return Q.all(_this.getCreateSuffixes().map(function(suffix) {
                    return _this.storeCreateResult(_this.getPath(prefix, suffix), suffix, res[suffix], force);
                })).get(0);
            });
        },

        /**
         * Read and return content of object identified by specified
         * prefix for specified suffix.
         *
         * @protected
         * @param {String} path    Full path of object to read.
         * @param {String} suffix  Suffix of object to read.
         * @returns {Promise * String}
         */
        readContent: function(path, suffix) {
            return QFS.exists(path).then(function(exists) {
                if(!exists) return '';

                return bemUtil.readFile(path);
            });
        },

        /**
         * Read and return content of object identified by specified prefix.
         *
         * @param {String}  prefix  Path prefix of object to read content of.
         * @returns {Promise * Object}
         */
        readAllContent: function(prefix) {
            var _this = this,
                res = {};

            return Q
                .all(this.getCreateSuffixes().map(function(suffix) {
                    return _this.readContent(_this.getPath(prefix, suffix), suffix)
                        .then(function(r) {
                            res[suffix] = r;
                        });
                }))
                .then(function() {
                    return res;
                });
        },

        /**
         * Implementation of 'bem build' command.
         *
         * @public
         * @param {Object}  decl     BEM entities declaration.
         * @param {Level[]} levels   Array of levels.
         * @param {String}  output   Path prefix of output.
         * @param {Object} opts Custom opts.
         * @returns {Promise * Undefined}
         */
        buildByDecl: function(decl, levels, output, opts) {

            return this.storeBuildResults(
                output,
                this.getBuildResults(this.transformBuildDecl(decl), levels, output, opts));
        },

        /**
         * Return transformed build declaration.
         *
         * @param {Promise * (Object|Array)} decl  Initial declaration.
         * @returns {Promise * (Object|Array)}  Promise of transformed declaration.
         */
        transformBuildDecl: function(decl) {
            return Q.resolve(decl);
        },

        /**
         * Return build result chunk.
         *
         * @protected
         * @param {String} relPath  Path to source object, relative to output directory.
         * @param {String} path     Absolute path to source object.
         * @param {String} suffix   Suffix of source object.
         * @returns {String}        Build result chunk.
         */
        getBuildResultChunk: function(relPath, path, suffix) {
            return relPath + '\n';
        },

        /**
         * Build and return result of build of specified prefixes
         * for specified suffix.
         *
         * @protected
         * @param {Promise * String[]} path Files to build from.
         * @param {String}          suffix      Suffix to build result for.
         * @param {String}          output   Output prefix of build result.
         * @param {Object}          opts   Options.
         * @returns {Promise * String}  Promise for build result.
         */
        getBuildResult: function(files, suffix, output, opts) {
            var _this = this;
            return Q.all(files.map(function(file) {
                return _this.getBuildResultChunk(
                    PATH.relative(PATH.dirname(output)+PATH.dirSep, file.absPath), file.absPath, file.suffix);
            }));
        },

        /**
         * Build and return result of build of specified prefixes.
         *
         * @protected
         * @param {Promise * Object} decl Declaration to build from.
         * @param {Object[]} levels Array of levels to use.
         * @param {String}          output   Output prefix of build result.
         * @param {Object} opts Custom options
         * @returns {Promise * Object}  Promise for build results object.
         */
        getBuildResults: function(decl, levels, output, opts) {
            var _this = this,
                res = {},
                files = this.getBuildPaths(decl, levels);

            return files.then(function(files) {
                return Q.all(_this.getBuildSuffixes()
                    .map(function(destSuffix) {
                        var filteredFiles = files[destSuffix] || [],
                            file = _this.getPath(output, destSuffix);

                        return _this.validate(file, filteredFiles, opts)
                            .then(function(valid) {
                                LOGGER.fverbose('file %s is %s', file, valid?'valid':'not valid');

                                if (!valid) {

                                    return _this.getBuildResult(filteredFiles, destSuffix, output, opts)
                                        .then(function(r) {
                                            res[destSuffix] = r;
                                            return _this.saveLastUsedData(file, {buildFiles: filteredFiles});
                                        });
                                }
                            });
                    }))
                    .then(function() {
                        return res;
                    });
            });
        },

        /**
         * Determines is file up to date or not by comparing the list of files to use for build
         * with such saved list during previous build. Will return false if opts.force is defined.
         * @param {String} file File which is being built
         * @param {Object[]} files The list of files which will be used.
         * @param {Object} opts Custom options.
         * @return {Promise * boolean}
         */
        validate: function(file, files, opts) {
            if (opts.force) return Q.resolve(false);

            var _this = this;

            return Q.all([_this.getLastUsedData(file),
                          QFS.exists(file)])

                .spread(function(prevFiles, exists) {
                    prevFiles = prevFiles.buildFiles;
                    if (prevFiles && prevFiles.length === files.length)
                        return _this.sameFiles(files, prevFiles) && exists;
                    else
                        return false;
                });
        },

        /**
         * Compares two lists of files.
         * @param {Object[]} now
         * @param {Object[]} old
         * @return {Boolean}
         */
        sameFiles: function(now, old) {
            for(var i = 0; i < now.length; i++) {
                var n = now[i],
                    o = old[i];

                if (n.absPath !== o.absPath ||
                    n.lastUpdated !== o.lastUpdated) {
                    return false;
                }
            }

            return true;
        },

        /**
         * Loads appropriate meta file for the file which is being built.
         * @param {String} file File path which is being built.
         * @return {Object} Object created from the meta file using deserialization.
         */
        getLastUsedData: function(file) {
            var root = this.context.opts.root || '';

            file = PATH.join(
                root, '.bem', 'cache',
                PATH.relative(root, file) + '~' + this.getTechName() + '.meta.js');

            return bemUtil
                .readFile(file)
                .fail(function() {
                    // meta file does not exist probably
                    return '{}';
                })
                .then(function(content) {
                    try {
                        return JSON.parse(content);
                    } catch (err) {
                        LOGGER.fwarn('meta file %s failed to parse. It will be regenerated.', file);
                        return {};
                    }
                });
        },

        saveLastUsedData: function(file, data) {
            var root = this.context.opts.root || '';
            file = PATH.join(
                root, '.bem', 'cache',
                PATH.relative(root, file) + '~' + this.getTechName() + '.meta.js');

            return Q.when(bemUtil.mkdirs(PATH.dirname(file)))
                .then(function() {
                    return bemUtil.writeFile(file, JSON.stringify(data));
                });
        },

        getBuildPaths: function(decl, levels) {
            var _this = this,
                res = {},
                suffixesMap = this.getSuffixesMap();

            return Q.when(decl, function(decl) {

                return Q
                    .all(levels.map(function(level) {
                        return level.scanFiles();
                    }))
                    .then(function() {
                        LOGGER.time('getBuildPaths');


                        if (decl.deps) for(var d = 0; d < decl.deps.length; d++) {
                            var dep = decl.deps[d];

                            for(var l = 0; l < levels.length; l++) {
                                var level = levels[l],
                                    files = level.getFileByObjIfExists(dep, _this);

                                if (files) {
                                    for(var i = 0; i < files.length; i++) {
                                        var file = files[i],
                                            buildSuffixes = suffixesMap[file.suffix[0] === '.'?file.suffix.substr(1):file.suffix];

                                        if (buildSuffixes) {
                                            for(var bs = 0; bs < buildSuffixes.length; bs++) {
                                                var buildSuffix = buildSuffixes[bs];
                                                (res[buildSuffix] || (res[buildSuffix] = [])).push(file);
                                            }
                                        }
                                    }
                                }

                            }
                        }

                        LOGGER.timeEndLevel('silly', 'getBuildPaths');
                        return res;
                    });
            });
        },


        /**
         * Store result of build for specified suffix.
         *
         * @protected
         * @param {String} path    Path of object to store.
         * @param {String} suffix  Suffix of object to store.
         * @param {String} res     Result of build for specified suffix.
         * @returns {Promise * Undefined}
         */
        storeBuildResult: function(path, suffix, res) {
            return bemUtil.writeFile(path, res);
        },

        /**
         * Store results of build.
         *
         * @protected
         * @param {String}              prefix  Prefix of object to build.
         * @param {Promise * String}    res     Result of build.
         * @return {Promise * Undefined}
         */
        storeBuildResults: function(prefix, res) {
            var _this = this;
            return Q.when(res, function(res) {
                return Q.all(Object.keys(res).map(function(suffix) {
                    return _this.storeBuildResult(_this.getPath(prefix, suffix), suffix, res[suffix]);
                })).get(0);
            });
        },

        /**
         * Return true if suffix mathes one of tech suffixes.
         *
         * @public
         * @param {String} suffix  Suffix to match.
         * @returns {Boolean}
         */
        matchSuffix: function(suffix) {
            (suffix.substr(0, 1) === '.') && (suffix = suffix.substr(1));
            return this.getSuffixes().indexOf(suffix) >= 0;
        },

        _suffixes: null,
        /**
         * Return all tech suffixes.
         *
         * @public
         * @returns {String[]}
         */
        getSuffixes: function() {
            if (this._suffixes) return this._suffixes;

            var res = [],
                map = this.getBuildSuffixesMap();

            Object.keys(map).forEach(function(bs) {
                res = res.concat(map[bs]);
            }, this);

            this._suffixes = _.uniq(res);

            return this._suffixes;
        },

        /**
         * Return tech suffixes to use in process of bem create.
         *
         * @return {String[]}
         */
        getCreateSuffixes: function() {
            return this.getSuffixes();
        },

        /**
         * Return tech suffixes to use in process of bem build.
         *
         * @return {String[]}
         */
        getBuildSuffixes: function() {
            return Object.keys(this.getBuildSuffixesMap());
        },

        getBuildSuffixesMap: function() {
            var res = {};
            res[this.getTechName()] = [this.getTechName()];

            return res;
        },

        getSuffixesMap: function() {
            var buildMap = this.getBuildSuffixesMap(),
                srcMap = {};

            Object.keys(buildMap).forEach(function(buildSuffix) {
                buildMap[buildSuffix].forEach(function(srcSuffix) {
                    (srcMap[srcSuffix] || (srcMap[srcSuffix] = [])).push(buildSuffix);
                }, this);
            }, this);

            return srcMap;
        },

        /**
         * Return path by prefix and suffix.
         *
         * @public
         * @param {String} prefix
         * @param {String} suffix
         * @returns {String}
         */
        getPath: function(prefix, suffix) {
            suffix = suffix || this.getTechName();
            return [prefix, suffix].join('.');
        },

        /**
         * Return all paths by prefix.
         *
         * @public
         * @param {String|String[]} prefixes
         * @param {String|String[]} suffixes
         * @returns {String[]}
         */
        getPaths: function(prefixes, suffixes) {
            prefixes = Array.isArray(prefixes)? prefixes : [prefixes];
            suffixes = (!Array.isArray(suffixes) && suffixes) ?
                [suffixes] :
                (suffixes || this.getSuffixes());

            var _this = this,
                paths = [];

            prefixes.forEach(function(p) {
                suffixes.forEach(function(s) {
                    paths.push(_this.getPath(p, s));
                });
            });

            return paths;
        },

        /**
         * Return tech name.
         *
         * @public
         * @returns {String}
         */
        getTechName: function() {
            if(this.techName) return this.techName;
            return bemUtil.stripModuleExt(PATH.basename(this.getTechPath()));
        },

        /**
         * Return tech module absolute path.
         *
         * @public
         * @returns {String}
         */
        getTechPath: function() {
            return this.techPath;
        },

        /**
         * Return tech module relative path.
         *
         * @public
         * @param   {String} from  Path to calculate relative path from.
         * @returns {String}
         */
        getTechRelativePath: function(from) {
            from = PATH.join(from || '.', PATH.dirSep);
            var absPath = this.getTechPath(),
                techPath = PATH.relative(PATH.join(__dirname, PATH.unixToOs('../../../')), absPath),

                testDotRe = new RegExp('^[\\.' + PATH.dirSepRe + ']'),
                testLibRe = new RegExp('^.*?' + PATH.dirSepRe + 'lib'),
                replaceRe = new RegExp('^.*?' + PATH.dirSepRe);

            // tech from 'bem' module
            if(!testDotRe.test(techPath) && testLibRe.test(techPath)) {
                techPath = techPath.replace(replaceRe, PATH.unixToOs('bem/'));
            } else {
                // look for tech into node_modules and NODE_PATH env variable
                var shortestPath = PATH.relative(from, absPath);
                shortestPath = shortestPath.split(PATH.dirSep);
                module.paths.concat(bemUtil.getNodePaths()).forEach(function(reqPath) {
                    var relPath = PATH.relative(PATH.join(reqPath, PATH.dirSep), absPath);
                    if(!/^\./.test(relPath)) {
                        relPath = relPath.split(PATH.dirSep);
                        if(relPath.length < shortestPath.length) {
                            shortestPath = relPath;
                        }
                    }
                });

                techPath = PATH.join.apply(null, shortestPath);
                // NOTE: could not replace to PATH.join('.', techPath), because of
                // '.' will be stripped
                if(!/^\./.test(techPath)) techPath = '.' + PATH.dirSep + techPath;
            }

            // NOTE: default tech, need to return empty path for it
            if(techPath === bemUtil.getBemTechPath('default')) return '';
            return techPath;
        },

        /**
         * Return array of tech name dependencies.
         *
         * @public
         * @return {String[]}
         */
        getDependencies: function() {
            return [];
        }

    }, {

        /**
         * Set context to use in all tech modules.
         *
         * @static
         * @public
         * @param {Context} ctx  Context instance object.
         */
        setContext: function(ctx) {
            Tech.prototype.context = ctx;
            require('./../legacy-tech').Tech.setContext(ctx);
        }

    });


