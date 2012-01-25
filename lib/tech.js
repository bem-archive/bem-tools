var UTIL = require('util'),
    Q = require('qq'),
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
         * @public
         * @param {String}  prefix  path prefix of object to create
         * @param {Object}  vars    variables to use in template
         * @param {Boolean} force   force creation flag
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
         * @returns {String}
         */
        getCreateResult: function(path, suffix, vars) {
            return '';
        },

        /**
         * Returns create result for all suffixes
         * @protected
         * @param {String}  prefix  path prefix of object to create
         * @param {Object}  vars    variables to use in template
         * @returns {Object}
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
         */
        storeCreateResult: function(path, suffix, res, force) {
            return Q.step(
                function() {
                    return bemUtil.isFileP(path);
                },
                function(exists) {
                    if(exists && !force) {
                        // TODO: bad idea to output error to console directly
                        UTIL.error("Already exists '" + path + "'");
                        return;
                    }
                    return bemUtil.writeFile(path, res);
                }
            );
        },

        /**
         * Stores results of object creation
         * @protected
         * @param {String}  prefix  path prefix of object to create
         * @param {Object}  res     result of object creation
         * @param {Boolean} force   force creation flag
         */
        storeCreateResults: function(prefix, res, force) {
            var _this = this;
            return Q.when(res, function(res) {
                var done;
                _this.getSuffixes().forEach(function(suffix) {
                    done = Q.wait(done, _this.storeCreateResult(_this.getPath(prefix, suffix), suffix, res[suffix], force));
                });
                return done;
            });
        },

        /**
         * Reads and returns content of object with specified prefix
         * for specified suffix
         * @protected
         * @param {String} path    full path of object to read
         * @param {String} suffix  suffix of object to read
         * @returns {String}
         */
        readContent: function(path, suffix) {
            return Q.when(bemUtil.isFile(path), function(exists) {
                if(exists) {
                    return bemUtil.readFile(path);
                }
                return '';
            });
        },

        /**
         * Reads and returns content of object with specified prefix
         * @param {String}  prefix  path prefix of object to read content of
         * @returns {Object}
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
         * @param {Array}  prefixes    prefixes to build
         * @param {String} outputDir   dir to output result to
         * @param {String} outputName  name prefix of output
         */
        build: function(prefixes, outputDir, outputName) {
            return this.storeBuildResults(
                PATH.join(outputDir, outputName),
                this.getBuildResults(prefixes, outputDir, outputName));
        },

        /**
         * Filters prefixes with attached suffixes and returns
         * array of paths to aggregate during build process
         * @protected
         * @param {Array} prefixes
         * @param {Array} suffixes
         * @return {Array}
         */
        filterPrefixes: function(prefixes, suffixes) {
            var _this = this,
                res = {};

            prefixes.forEach(function(prefix) {
                suffixes.forEach(function(suffix) {
                    var path = _this.getPath(prefix, suffix);
                    res[path] = bemUtil.isExists(path);
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
         * @param {Array} prefixes     prfixes to build
         * @param {String} suffix      suffix to build result for
         * @param {String} outputDir   output dir name for build result
         * @param {String} outputName  output name of build result
         */
        getBuildResult: function(prefixes, suffix, outputDir, outputName) {
            var _this = this;
            return Q.when(this.filterPrefixes(prefixes, [suffix]), function(paths) {
                return Q.shallow(paths.map(function(path) {
                    return _this.getBuildResultChunk(
                        PATH.relative(outputDir, path), path, suffix);
                }));
            });
        },

        /**
         * Builds and returns result of build of specified prefixes
         * @protected
         * @param {Array} prefixes     prfixes to build
         * @param {String} outputDir   output dir name for build result
         * @param {String} outputName  output name of build result
         * @return {Object}
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
         */
        storeBuildResult: function(path, suffix, res) {
            return bemUtil.writeFile(path, res);
        },

        /**
         * Stores results of build
         * @protected
         * @param {String} prefix  prefix of object to build
         * @param {String} res     result of build
         */
        storeBuildResults: function(prefix, res) {
            var _this = this;
            return Q.when(res, function(res) {
                var done;
                _this.getSuffixes().forEach(function(suffix) {
                    done = Q.wait(done, _this.storeBuildResult(_this.getPath(prefix, suffix), suffix, res[suffix]));
                });
                return done;
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
