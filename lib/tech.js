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
        else if (tech.techModule) TechClass = LegacyTech;

        return INHERIT(TechClass, tech);
    },

    createTech = exports.createTech = function(path, techName) {
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
            return PATH.basename(this.getTechPath());
        },

        getTechPath: function() {
            var exts = Object.keys(require.extensions).map(function(v) {
                    return v.replace(/^\./, '');
                });
            return this.techPath.replace(new RegExp('\\.(' + exts.join('|') + '$)'), '');
        },

        getTechRelativePath: function(from) {
            var absPath = this.getTechPath();

            // NOTE: Если путь до технологии пустой, значит используется
            // реализация технологии по-умолчанию, и путь надо оставить пустым
            if(!absPath) return '';

            // NOTE: Используется реализация технологии из bem/lib/techs/default,
            // путь надо оставить пустым
            if(absPath == bemUtil.getBemTechPath('default')) return '';

            // NOTE: Если путь до технологии относительный, значит используется
            // реализация технологии из библиотеки, и путь надо оставить без изменения
            if(!/^\//.test(absPath)) return absPath;

            from = PATH.join(from || '.', '/');
            var shortestPath = PATH.relative(from, absPath).split('/');
            bemUtil.getNodePaths().forEach(function(reqPath) {
                var relPath = PATH.relative(PATH.join(reqPath, '/'), absPath).split('/');
                if(relPath.length < shortestPath.length) {
                    shortestPath = relPath;
                }
            });

            return PATH.join.apply(null, shortestPath);
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
        },

        getTechPath: function() {
            return this.techObj.getTechPath();
        }

    });
