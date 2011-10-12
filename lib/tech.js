var FS = require('fs'),
    SYS = require('sys'),
    bemUtil = require('./util'),
    PATH = require('./path'),
    INHERIT = require('inherit'),

    Tech = exports.Tech = INHERIT({

        __constructor: function(techName) {
            this.techName = techName;
        },

        setContext: function(ctx) {
            this.context = ctx;
            return this;
        },

        getContext: function() {
            return this.context;
        },

        create: function(prefix, vars, force) {
            this.storeCreateResult(
                this.getPathByPrefix(prefix),
                this.getCreateResult(prefix, vars),
                force);

            return this;
        },

        getCreateResult: function(prefix, vars) {
            return '';
        },

        storeCreateResult: function(path, res, force) {
            if(bemUtil.isFile(file) && !force) {
                SYS.error('Уже существует ' + file);
                return this;
            }
            bemUtil.write(path, res);

            return this;
        },

        readPrefixContent: function(prefix) {
            var file = this.fileByPrefix(prefix);
            if(bemUtil.isFile(file)) {
                return FS.readFileSync(file, 'utf8');
            }
            SYS.error('Нет файла ' + file);
            return '';
        },

        build: function(prefixes, outputDir, outputName) {
            this.storeBuildResult(
                this.getPathByPrefix(PATH.join(outputDir, outputName)),
                this.getBuildResult(prefixes, outputDir, outputName));

            return this;
        },

        filterPrefixes: function(prefixes) {
            var _this = this,
                res = [];
            prefixes.forEach(function(prefix) {
                var file = _this.getPathByPrefix(prefix);
                PATH.existsSync(file) && res.push(file);
            });

            return res;
        },

        getBuildResultForPrefix: function(relPath, prefix) {
            return relPath + '\n';
        },

        getBuildResult: function(prefixes, outputDir, outputName) {
            var _this = this;
            return this
                .filterPrefixes(prefixes)
                .map(function(prefix) {
                    return _this.getBuildResultForPrefix(
                        PATH.relative(outputDir, prefix), prefix);
                });
        },

        storeBuildResult: function(path, res) {
            bemUtil.write(path, res);
            return this;
        },

        matchSuffix: function(suffix) {
            return this.getSuffix() == suffix;
        },

        getSuffix: function() {
            return '.' + this.getTechName();
        },

        getPathByPrefix: function(prefix) {
            return prefix + this.getSuffix();
        },

        getTechName: function() {
            if(this.techName) return this.techName;
            return PATH.basename(this.getTechPath());
        },

        getTechPath: function() {
            return this.techModule.filename.replace(/\.(js|node)$/, '');
        },

        getTechRelativePath: function(bemPath) {
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

            // FIXME: лучше искать «короткий путь», обдумать критерии такого пути
            // FIXME: использовать require.resolve
            // FIXME: поддержка node >= 0.5, см. https://mail.yandex.ru/neo2/#message/2170000000008426201
            bemPath = PATH.join(bemPath || '.', '/');
            var shortestPath = PATH.relative(bemPath, absPath);
            require.paths.forEach(function(reqPath) {
                var relPath = PATH.relative(PATH.join(reqPath, '/'), absPath);
                if(relPath.length < shortestPath.length) {
                    shortestPath = relPath;
                }
            });

            return shortestPath;
        }

    }, {

        createTech: function(path, techName) {
            var tech = require(path);
            if(tech.techModule && !tech.Tech) {
                return new (require('./old-tech.js').Tech)(path, techName);
            }
            return new (tech.Tech)(techName);
        },

        setContext: function(ctx) {
            Tech.prototype.context = ctx;
        }

    });
