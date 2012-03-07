var Q = require('qq'),
    QFS = require('q-fs'),
    bemUtil = require('./util'),
    PATH = require('./path'),
    INHERIT = require('inherit'),

    /**
     * Returns tech class for tech module path
     * @param {String} path  path to tech module
     * @returns {Tech}
     */
    getTechClass = exports.getTechClass = function(path) {
        var tech = require(path),
            TechClass = Tech;

        if(tech.Tech) return tech.Tech;
        if(tech.baseTechPath) TechClass = getTechClass(tech.baseTechPath);
        else if (tech.techModule || tech.bemBuild || tech.bemCreate) TechClass = LegacyTech;

        return INHERIT(TechClass, tech);
    },

    /**
     * Returns tech object for tech module
     * @param {String} path  tech module absolute path
     * @param {String} name  tech name
     * @returns {Tech}
     */
    createTech = exports.createTech = function(path, name) {
        path = require.resolve(path);
        return new (getTechClass(path))(name, path);
    },

    Tech = exports.Tech = INHERIT({

        /**
         * @class Base tech class
         * @constructs
         * @private
         * @param {Object} name  tech name
         * @param {Object} path  tech module absolute path
         */
        __constructor: function(name, path) {
            this.techName = name;
            this.techPath = path;
        },

        /**
         * Sets context to use in tech modules
         * @public
         * @param {Context} ctx  context
         */
        setContext: function(ctx) {
            this.context = ctx;
            return this;
        },

        /**
         * Returns context
         * @public
         * @returns {Context}
         */
        getContext: function() {
            return this.context;
        },

        /**
         * Implementation of 'bem create block | elem | mod' commands
         * @param {Object}  item    bem item declaration
         * @param {Object}  level   level
         * @param {Boolean} force   force file creation flag
         * @returns {Promise * Undefined}
         */
        createByDecl: function(item, level, force) {
            var prefix = level.getByObj(item),
                vars = {
                    BlockName: item.block,
                    Prefix: prefix
                };

            if (item.elem) vars.ElemName = item.elem;
            if (item.mod) vars.ModName = item.mod;
            if (item.val) vars.ModVal = item.val;

            return this.create(prefix, vars, force);
        },

        /**
         * Implementation of 'bem create block | elem | mod' commands
         * @public
         * @param {String}  prefix  path prefix of object to create
         * @param {Object}  vars    variables to use in template
         * @param {Boolean} force   force creation flag
         * @returns {Promise * Undefined}
         */
        create: function(prefix, vars, force) {
            return this.storeCreateResults(prefix, this.getCreateResults(prefix, vars), force);
        },

        /**
         * Returns create result for one suffix
         * @protected
         * @param {String} path    full path of object to create
         * @param {String} suffix  suffix of object to create
         * @param {Object} vars    variables to use in template
         * @returns {Promise * String}
         */
        getCreateResult: function(path, suffix, vars) {
            return Q.ref('');
        },

        /**
         * Returns create result for all suffixes
         * @protected
         * @param {String}  prefix  path prefix of object to create
         * @param {Object}  vars    variables to use in template
         * @returns {Promise * Object}
         */
        getCreateResults: function(prefix, vars) {
            var _this = this,
                res = {};

            this.getSuffixes().forEach(function(suffix) {
                res[suffix] = _this.getCreateResult(_this.getPath(prefix, suffix), suffix, vars);
            });

            return Q.shallow(res);
        },

        /**
         * Stores result of object creation for one suffix
         * @protected
         * @param {String}  path    full path of object to create
         * @param {String}  suffix  suffix of object to create
         * @param {Object}  res     result of object creation
         * @param {Boolean} force   force creation flag
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
         * Stores results of object creation
         * @protected
         * @param {String}  prefix  path prefix of object to create
         * @param {Object}  res     result of object creation
         * @param {Boolean} force   force creation flag
         * @returns {Promise * Undefined}
         */
        storeCreateResults: function(prefix, res, force) {
            var _this = this;
            return Q.when(res, function(res) {
                return Q.all(_this.getSuffixes().map(function(suffix) {
                    return _this.storeCreateResult(_this.getPath(prefix, suffix), suffix, res[suffix], force);
                })).get(0);
            });
        },

        /**
         * Reads and returns content of object with specified prefix
         * for specified suffix
         * @protected
         * @param {String} path    full path of object to read
         * @param {String} suffix  suffix of object to read
         * @returns {Promise * String}
         */
        readContent: function(path, suffix) {
            return QFS.exists(path).then(function(exists) {
                if(!exists) return '';

                return QFS.read(path, { charset: 'utf8' });
            });
        },

        /**
         * Reads and returns content of object with specified prefix
         * @param {String}  prefix  path prefix of object to read content of
         * @returns {Promise * Object}
         */
        readAllContent: function(prefix) {
            var _this = this,
                res = {};

            this.getSuffixes().forEach(function(suffix) {
                res[suffix] = _this.readContent(_this.getPath(prefix, suffix), suffix);
            });

            return Q.shallow(res);
        },

        /**
         * Implementation of 'bem build' command
         * @public
         * @param {Object} decl     bem items declaration
         * @param {Array}  levels   array of levels
         * @param {Array}  output   path prefix of output
         * @returns {Promise * Undefined}
         */
        buildByDecl: function(decl, levels, output) {
            return this.build(this.getBuildPrefixes(this.transformBuildDecl(decl), levels),
                PATH.dirname(output) + PATH.dirSep, PATH.basename(output));
        },

        /**
         * Return transformed build declaration
         * @param {Object|Array} decl   initial declaration
         * @returns {Promise * (Object || Array)}   promise of transformed declaration
         */
        transformBuildDecl: function(decl) {
            return Q.ref(decl);
        },

        /**
         * Return build prefixes for declaration and levels.
         * @param {Promise * (Object || Array)} decl        decraration
         * @param {Array}                       levels      levels
         * @returns {Promise * Array}                       prefixes
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
         * Implementation of 'bem build' command
         * @public
         * @param {Array}  prefixes    prefixes to build
         * @param {String} outputDir   dir to output result to
         * @param {String} outputName  name prefix of output
         * @returns {Promise * Undefined}
         */
        build: function(prefixes, outputDir, outputName) {
            return this.storeBuildResults(
                PATH.resolve(outputDir, outputName),
                this.getBuildResults(prefixes, outputDir, outputName));
        },

        /**
         * Filters prefixes with attached suffixes and returns
         * array of paths to aggregate during build process
         * @protected
         * @param {Array} prefixes
         * @param {Array} suffixes
         * @returns {Array}         promise
         */
        filterPrefixes: function(prefixes, suffixes) {
            var _this = this,
                res = {};

            prefixes.forEach(function(prefix) {
                suffixes.forEach(function(suffix) {
                    var path = _this.getPath(prefix, suffix);
                    res[path] = QFS.exists(path);
                });
            });

            return Q.when(Q.shallow(res), function(res) {
                var paths = [];
                for(var path in res) {
                    if(res[path]) paths.push(path);
                }
                return paths;
            });
        },

        /**
         * Returns build result chunk
         * @protected
         * @param {String} relPath  relative path to source object
         * @param {String} path     path to source object
         * @param {String} suffix   suffix of source object
         * @returns {String}
         */
        getBuildResultChunk: function(relPath, path, suffix) {
            return relPath + '\n';
        },

        /**
         * Builds and returns result of build of specified prefixes
         * for specified suffix
         * @protected
         * @param {Promise * Array} prefixes     prfixes to build
         * @param {String}          suffix      suffix to build result for
         * @param {String}          outputDir   output dir name for build result
         * @param {String}          outputName  output name of build result
         * @returns {Promise * String}
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
         * Builds and returns result of build of specified prefixes
         * @protected
         * @param {Promise * Array} prefixes    prefixes to build
         * @param {String}          outputDir   output dir name for build result
         * @param {String}          outputName  output name of build result
         * @returns {Promise * Object}
         */
        getBuildResults: function(prefixes, outputDir, outputName) {
            var _this = this,
                res = {};

            this.getSuffixes().forEach(function(suffix) {
                res[suffix] = _this.getBuildResult(prefixes, suffix, outputDir, outputName);
            });

            return Q.shallow(res);
        },

        /**
         * Stores result of build for specified suffix
         * @protected
         * @param {String} path    path of object to store
         * @param {String} suffix  suffix of object to store
         * @param {String} res     result of build for specified suffix
         * @returns {Promise * Undefined}
         */
        storeBuildResult: function(path, suffix, res) {
            return bemUtil.writeFile(path, res);
        },

        /**
         * Stores results of build
         * @protected
         * @param {String}              prefix  prefix of object to build
         * @param {Promise * String}    res     result of build
         * @return {Promise * Undefined}
         */
        storeBuildResults: function(prefix, res) {
            var _this = this;
            return Q.when(res, function(res) {
                return Q.all(_this.getSuffixes().map(function(suffix) {
                    return _this.storeBuildResult(_this.getPath(prefix, suffix), suffix, res[suffix]);
                })).get(0);
            });
        },

        /**
         * Returns true if suffix mathes one of tech suffixes
         * @public
         * @param {String} suffix
         * @returns {Boolean}
         */
        matchSuffix: function(suffix) {
            (suffix.substr(0, 1) == '.') && (suffix = suffix.substr(1));
            return this.getSuffixes().indexOf(suffix) >= 0;
        },

        /**
         * Returns all tech suffixes
         * @public
         * @returns {Array}
         */
        getSuffixes: function() {
            return [this.getTechName()];
        },

        /**
         * Returns path by prefix and suffix
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
         * Returns all paths by prefix
         * @public
         * @param {String} prefix
         * @returns {Array}
         */
        getPaths: function(prefix) {
            var _this = this;
            return this.getSuffixes().map(function(suffix) {
                return _this.getPath(prefix, suffix);
            });
        },

        /**
         * Returns tech name
         * @public
         * @returns {String}
         */
        getTechName: function() {
            if(this.techName) return this.techName;
            return bemUtil.stripModuleExt(PATH.basename(this.getTechPath()));
        },

        /**
         * Returns tech module absolute path
         * @public
         * @returns {String}
         */
        getTechPath: function() {
            return this.techPath;
        },

        /**
         * Returns tech module relative path
         * @public
         * @param   {String} from  path to calculate relative path from
         * @returns {String}
         */
        getTechRelativePath: function(from) {
            from = PATH.join(from || '.', PATH.dirSep);
            var absPath = this.getTechPath(),
                techPath = PATH.relative(PATH.join(__dirname, PATH.unixToOs('../../')), absPath),

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

            techPath = bemUtil.stripModuleExt(techPath);

            // NOTE: default tech, need to return empty path for it
            if(techPath == bemUtil.getBemTechPath('default')) return '';
            return techPath;
        }

    }, {

        /**
         * Sets context to use in tech modules
         * @static
         * @public
         * @param {Context} ctx  context
         */
        setContext: function(ctx) {
            Tech.prototype.context = ctx;
            require('./legacy-tech').Tech.setContext(ctx);
        }

    }),

    LegacyTech = INHERIT(Tech, {

        /**
         * @class Legacy tech modules wrapper class
         * @constructs
         * @private
         * @param {Object} name  tech name
         * @param {Object} path  tech module absolute path
         */
        __constructor: function(name, path) {
            this.techObj = new (require('./legacy-tech').Tech)(path, name);
            this.__base(name, path);
        },

        create: function(prefix, vars, force) {
            return this.techObj.bemCreate(prefix, vars, force);
        },

        readAllContent: function(prefix) {
            var res = {};
            res[this.getTechName()] = this.techObj.getFileContent(prefix);
            return res;
        },

        build: function(prefixes, outputDir, outputName) {
            return this.techObj.bemBuild(prefixes, outputDir, outputName);
        },

        getTechName: function() {
            return this.techObj.getTechName();
        }

    });
