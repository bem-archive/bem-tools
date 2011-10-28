var FS = require('fs'),
    SYS = require('sys'),
    bemUtil = require('./util'),
    PATH = require('./path'),
    INHERIT = require('inherit'),

    getTechClass = function(path) {
        var tech = require(path),
            TechClass = Tech;

        if(tech.Tech) return tech.Tech;
        if(tech.baseTechPath) TechClass = getTechClass(tech.baseTechPath);
        else if (tech.techModule || tech.bemBuild || tech.bemCreate) TechClass = LegacyTech;

        return INHERIT(TechClass, tech);
    },

    createTech = exports.createTech = function(path, techName) {
        path = require.resolve(path);
        return new (getTechClass(path))(techName, path);
    },

    Tech = exports.Tech = INHERIT({

        __constructor: function(name, path) {
            this.techName = name;
            this.techPath = path;
        },

        setContext: function(ctx) {
            this.context = ctx;
            return this;
        },

        getContext: function() {
            return this.context;
        },

        create: function(prefix, vars, force) {
            this.storeCreateResults(prefix, this.getCreateResults(prefix, vars), force);
            return this;
        },

        getCreateResult: function(path, suffix, vars) {
            return '';
        },

        getCreateResults: function(prefix, vars) {
            var _this = this,
                res = {};

            this.getSuffixes().forEach(function(suffix) {
                res[suffix] = _this.getCreateResult(_this.getPath(prefix, suffix), suffix, vars);
            });

            return res;
        },

        storeCreateResult: function(path, suffix, res, force) {
            if(bemUtil.isFile(path) && !force) {
                SYS.error('Уже существует ' + path);
                return this;
            }

            bemUtil.write(path, res);
        },

        storeCreateResults: function(prefix, res, force) {
            var _this = this;

            this.getSuffixes().forEach(function(suffix) {
                _this.storeCreateResult(_this.getPath(prefix, suffix), suffix, res[suffix], force);
            });

            return this;
        },

        readContent: function(path, suffix) {
            if(bemUtil.isFile(path)) {
                return FS.readFileSync(path, 'utf8');
            }

            //SYS.error('Нет файла ' + path);
            return '';
        },

        readAllContent: function(prefix) {
            var _this = this,
                res = {};

            this.getSuffixes().forEach(function(suffix) {
                res[suffix] = _this.readContent(_this.getPath(prefix, suffix), suffix);
            });

            return res;
        },

        build: function(prefixes, outputDir, outputName) {
            this.storeBuildResults(
                PATH.join(outputDir, outputName),
                this.getBuildResults(prefixes, outputDir, outputName));

            return this;
        },

        filterPrefixes: function(prefixes, suffixes) {
            var _this = this,
                res = [];

            prefixes.forEach(function(prefix) {
                suffixes.forEach(function(suffix) {
                    var path = _this.getPath(prefix, suffix);
                    PATH.existsSync(path) && res.push(path);
                });
            });

            return res;
        },

        getBuildResultForPrefix: function(relPath, path, suffix) {
            return relPath + '\n';
        },

        getBuildResult: function(prefixes, suffix, outputDir, outputName) {
            var _this = this;
            return this
                .filterPrefixes(prefixes, [suffix])
                .map(function(path) {
                    return _this.getBuildResultForPrefix(
                        PATH.relative(outputDir, path), path, suffix);
                });
        },

        getBuildResults: function(prefixes, outputDir, outputName) {
            var _this = this,
                res = {};

            this.getSuffixes().forEach(function(suffix) {
                res[suffix] = _this.getBuildResult(prefixes, suffix, outputDir, outputName);
            });

            return res;
        },

        storeBuildResult: function(path, suffix, res) {
            bemUtil.write(path, res);
        },

        storeBuildResults: function(prefix, res) {
            var _this = this;

            this.getSuffixes().forEach(function(suffix) {
                _this.storeBuildResult(_this.getPath(prefix, suffix), suffix, res[suffix]);
            });

            return this;
        },

        matchSuffix: function(suffix) {
            (suffix.substr(0, 1) == '.') && (suffix = suffix.substr(1));
            return this.getSuffixes().indexOf(suffix) >= 0;
        },

        getSuffixes: function() {
            return [this.getTechName()];
        },

        getPath: function(prefix, suffix) {
            suffix = suffix || this.getTechName();
            return [prefix, suffix].join('.');
        },

        getTechName: function() {
            if(this.techName) return this.techName;
            return bemUtil.stripModuleExt(PATH.basename(this.getTechPath()));
        },

        getTechPath: function() {
            return this.techPath;
        },

        getTechRelativePath: function(from) {
            from = PATH.join(from || '.', '/');
            var absPath = this.getTechPath(),
                techPath = PATH.relative(PATH.join(__dirname, '../../'), absPath);

            // tech from 'bem' module
            if(!/^[\.\/]/.test(techPath) && /^.*?\/lib/.test(techPath)) {
                techPath = techPath.replace(/^.*?\//, 'bem/');
            } else {
                // look for tech into node_modules and NODE_PATH env variable
                var shortestPath = PATH.relative(from, absPath);
                shortestPath = shortestPath.split('/');
                module.paths.concat(bemUtil.getNodePaths()).forEach(function(reqPath) {
                    var relPath = PATH.relative(PATH.join(reqPath, '/'), absPath);
                    if(!/^\./.test(relPath)) {
                        relPath = relPath.split('/');
                        if(relPath.length < shortestPath.length) {
                            shortestPath = relPath;
                        }
                    }
                });

                techPath = Array.prototype.join.call(shortestPath, '/');
                if(!/^\./.test(techPath)) techPath = './' + techPath;
            }

            techPath = bemUtil.stripModuleExt(techPath);

            // NOTE: default tech, need to return empty path for it
            if(techPath == bemUtil.getBemTechPath('default')) return '';
            return techPath;
        }

    }, {

        setContext: function(ctx) {
            Tech.prototype.context = ctx;
            require('./legacy-tech').Tech.setContext(ctx);
        }

    }),

    LegacyTech = INHERIT(Tech, {

        __constructor: function(techName, path) {
            this.techObj = new (require('./legacy-tech').Tech)(path, techName);
            this.__base(techName, path);
        },

        create: function(prefix, vars, force) {
            this.techObj.bemCreate(prefix, vars, force);
            return this;
        },

        readAllContent: function(prefix) {
            var res = {};
            res[this.getTechName()] = this.techObj.getFileContent(prefix);
            return res;
        },

        build: function(prefixes, outputDir, outputName) {
            this.techObj.bemBuild(prefixes, outputDir, outputName);
            return this;
        },

        getTechName: function() {
            return this.techObj.getTechName();
        }

    });
