'use strict';

var Q = require('q'),
    QFS = require('q-io/fs'),
    bemUtil = require('./../util'),
    PATH = require('./../path'),
    INHERIT = require('inherit'),
    LOGGER = require('./../logger'),

    Tech = exports.Tech = INHERIT(/** @lends Tech.prototype */ {

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
            this.showDeprecateMessage();
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
         * @returns {Promise * Undefined}
         */
        buildByDecl: function(decl, levels, output) {
            this.showDeprecateMessage();
            return this.build(this.getBuildPrefixes(this.transformBuildDecl(decl), levels),
                PATH.dirname(output) + PATH.dirSep, PATH.basename(output));
        },

        showDeprecateMessage: function() {
            bemUtil.deprecate('Tech module "' + this.techName + '" at ' + this.techPath + ' is using API V1.',
                              ['Tech modules API V1 is not recommended to use, because it is slow.',
                               'Please use tech modules API V2, it makes your build process faster!',
                               'Instructions for migrating to API V2: http://git.io/gbLDOA'].join('\n'));

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
         * Return build prefixes for BEM entities declaration and levels.
         *
         * @param {Promise * (Object|Array)} decl  Decraration of BEM entities to build.
         * @param {Level[]} levels  levels
         * @returns {Promise * String[]}  Prefixes of all BEM entities to build from.
         */
        getBuildPrefixes: function(decl, levels) {
            var prefixes = [],
                eachLevel = function(getter, args) {
                    // for each level
                    levels.forEach(function (level) {
                        // collect file frefix
                        prefixes.push(level.get(getter, args));
                    });
                },
                forItemWithMods = function(block, elem) {
                    var item = elem || block,
                        type = elem? 'elem' : 'block',
                        args = elem? [block.name, elem.name] : [block.name];

                    // for block or elem
                    eachLevel(type, args);

                    // for each modifier
                    item.mods && item.mods.forEach(function (mod) {

                        // for modifier
                        eachLevel(type + '-mod', args.concat(mod.name));

                        // for each modifier value
                        mod.vals && mod.vals.forEach(function (val) {
                            eachLevel(type + '-mod-val', args.concat(mod.name, val.name || val));
                        });

                    });
                },
                forBlockDecl = function (block) {
                    // for block
                    forItemWithMods(block);

                    // for each elem in block
                    block.elems && block.elems.forEach(function (elem) {
                        forItemWithMods(block, elem);
                    });
                },
                forBlocksDecl = function (blocks) {
                    // for each block in declaration
                    blocks.forEach(forBlockDecl);
                },
                forDepsDecl = function (deps) {
                    deps.forEach(function (dep) {
                        if(dep.block) {
                            var getter = 'block',
                                args = [dep.block];

                            if(dep.elem) {
                                getter = 'elem';
                                args.push(dep.elem);
                            }

                            if(dep.mod) {
                                getter += '-mod';
                                args.push(dep.mod);
                                if(dep.val) {
                                    getter += '-val';
                                    args.push(dep.val);
                                }
                            }

                            eachLevel(getter, args);
                        }
                    });
                };

            return Q.when(decl, function(decl) {
                decl.name && forBlockDecl(decl);
                decl.blocks && forBlocksDecl(decl.blocks);
                decl.deps && forDepsDecl(decl.deps);

                return prefixes;
            });
        },

        /**
         * Implementation of 'bem build' command.
         *
         * @public
         * @param {Promise * String[]} prefixes  Prefixes of BEM entities to build from.
         * @param {String} outputDir   Dir to output result to.
         * @param {String} outputName  Prefix of output.
         * @returns {Promise * Undefined}
         */
        build: function(prefixes, outputDir, outputName) {
            return this.storeBuildResults(
                PATH.resolve(outputDir, outputName),
                this.getBuildResults(prefixes, outputDir, outputName));
        },

        /**
         * Filter prefixes with attached suffixes and return
         * array of paths to aggregate during build process.
         *
         * @protected
         * @param {Promise * String[]} prefixes  Prefixes to filter.
         * @param {String[]} suffixes  Suffixes to append.
         * @returns {Promise * String[]}  Filtered paths.
         */
        filterPrefixes: function(prefixes, suffixes) {

            // Possible values: promised, callback, sync
            var strategy = process.env.BEM_IO_STRATEGY_FILTER_PREFIXES || process.env.BEM_IO_STRATEGY,
                _this = this;

            ['promised', 'callback', 'sync'].indexOf(strategy) !== -1 || (strategy = 'callback');
            LOGGER.fverbose('Using %s strategy in Tech.filterPrefixes()', strategy);

            return Q.when(prefixes, function(prefixes) {

                if (strategy === 'promised') {

                    // Promised file existence check
                    return (function() {

                        var paths = [],
                            res = [],
                            counter = 0;

                        prefixes.forEach(function(prefix) {
                            suffixes.forEach(function(suffix) {
                                var path = _this.getPath(prefix, suffix);
                                res[counter++] = QFS.exists(path);
                                paths.push(path);
                            });
                        });

                        return Q.shallow(res)
                            .then(function(res) {
                                return paths.filter(function(path, index) {
                                    return res[index];
                                });
                            });

                    })();

                }

                else if (strategy === 'callback') {

                    // Async file existence check
                    return (function() {

                        var paths = [];

                        prefixes.forEach(function(prefix) {
                            suffixes.forEach(function(suffix) {
                                paths.push(_this.getPath(prefix, suffix));
                            });
                        });

                        return bemUtil.filterPaths(paths);

                    })();

                }

                // Sync file existence check to get some ~100% build boost
                // See https://github.com/bem/bem-tools/pull/156
                return (function() {

                    var paths = [];

                    prefixes.forEach(function(prefix) {
                        suffixes.forEach(function(suffix) {
                            var path = _this.getPath(prefix, suffix);
                            if (PATH.existsSync(path)) paths.push(path);
                        });
                    });

                    return paths;

                })();

            });
        },

        /**
         * Return build result chunk.
         *
         * @protected
         * @param {String} relPath  Relative path to source object.
         * @param {String} path     Path to source object.
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
         * @param {Promise * String[]} prefixes Prefixes to build from.
         * @param {String}          suffix      Suffix to build result for.
         * @param {String}          outputDir   Output dir name for build result.
         * @param {String}          outputName  Output name of build result.
         * @returns {Promise * String}  Promise for build result.
         */
        getBuildResult: function(prefixes, suffix, outputDir, outputName) {
            var _this = this;
            return Q.when(this.filterPrefixes(prefixes, [suffix]), function(paths) {
                return Q.all(paths.map(function(path) {
                    return _this.getBuildResultChunk(
                        PATH.relative(outputDir, path), path, suffix);
                }));
            });
        },

        /**
         * Build and return result of build of specified prefixes.
         *
         * @protected
         * @param {Promise * String[]} prefixes Prefixes to build from.
         * @param {String}          outputDir   Output dir name for build result.
         * @param {String}          outputName  Output name of build result.
         * @returns {Promise * Object}  Promise for build results object.
         */
        getBuildResults: function(prefixes, outputDir, outputName) {
            var _this = this,
                res = {};

            return Q
                .all(this.getBuildSuffixes().map(function(suffix) {
                    return _this.getBuildResult(prefixes, suffix, outputDir, outputName)
                        .then(function(r) {
                            res[suffix] = r;
                        });
                }))
                .then(function() {
                    return res;
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
                return Q.all(_this.getBuildSuffixes().map(function(suffix) {
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

        /**
         * Return all tech suffixes.
         *
         * @public
         * @returns {String[]}
         */
        getSuffixes: function() {
            return [this.getTechName()];
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
            return this.getSuffixes();
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


