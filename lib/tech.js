var fs = require('fs'),
    bemUtil = require('./util'),
    myPath = require('./path');

exports.resolveTechModule = function (path) {
    // Попробовать получить модуль технологии по имени
    try {
        return require('./techs/' + path);
    } catch (ignore) {}

    // Попробовать получить модуль технологии по относительному
    // или абсолютному пути
    try {
        // NOTE: символические ссылки не разворачиваются
        return require(myPath.absolute(path));
    } catch (ignore) {}

    // Попробовать получить модуль технологии по пути относительно
    // require.paths
    try {
        return require(path);
    } catch (ignore) {}

    return {
        // FIXME: Подумать, что возвращать вместо фейка объекта модуля
        techModule: {
            id: myPath.basename(path, '.js'),
            path: ''
        }
    };
};

exports.Tech = function (path) {
    this.path = path || '';

    var tech = exports.resolveTechModule(path);
    for (var name in tech) {
        if (Object.prototype.hasOwnProperty.call(tech, name)) {
            this[name] = tech[name];
        }
    }
};

exports.Tech.prototype.bemBuild = function (prefixes, outputDir, outputName, callback) {
    var _this = this,
        content = '';
    this.filterExists(prefixes, function(filtered){
        filtered.map(function (file) {
            return myPath.relative(outputDir, file);
        })
        .forEach(function (file) {
            content += _this.outFile(file);
        });

        fs.createWriteStream(
                myPath.join(outputDir, outputName + '.' + _this.getTechName()),
                { encoding: 'utf8' })
            .write(content);

        callback && callback();
    });
    return this;
};

exports.Tech.prototype.bemCreate = function (prefix, vars) {
    var file = this.fileByPrefix(prefix);
    try {
        var stat = fs.statSync(file);
        stat && stat.isFile() &&
            sys.error('Уже существует ' + file);
    } catch(ignore) {}
    fs.createWriteStream(file, { encoding: 'utf8' })
        .write(this.newFileContent(vars));
    return this;
};

exports.Tech.prototype.filterExists = function (prefixes, callback) {
    var _this = this,
        res = [],
        keys = {};

    prefixes.forEach(function (p) { keys[p] = true });

    prefixes.forEach(function (prefix) {
        var file = _this.fileByPrefix(prefix);
        myPath.exists(file, function(exists){
            delete keys[prefix];
            exists && res.push(file);
            bemUtil.isEmptyObject(keys) && callback(res);
        });
    });
};

exports.Tech.prototype.fileByPrefix = function (prefix) {
    return prefix + '.' + this.getTechName();
};

exports.Tech.prototype.outFile = function (file) {
    return file + '\n';
};

exports.Tech.prototype.newFileContent = function () {
    return '';
};

exports.Tech.prototype.getTechName = function () {
    return myPath.basename(this.techModule.id, '.js');
};

exports.Tech.prototype.getTechRelativePath = function (bemPath) {
    var bemPath = myPath.join(bemPath, '/'),
        absPath = this.getTechPath();

    // NOTE: Если путь до технологии пустой, значит используется
    // реализация технологии по-умолчанию, и путь надо оставить пустым
    if (!absPath) return '';

    // FIXME: лучше искать «короткий путь», обдумать критерии такого пути
    var shortestPath = myPath.relative(bemPath, absPath);
    require.paths.forEach(function (reqPath) {
        var relPath = myPath.relative(myPath.join(reqPath, '/'), absPath);
        if (relPath.length < shortestPath.length) {
            shortestPath = relPath;
        }
    });

    return shortestPath;
};

exports.Tech.prototype.getTechPath = function () {
    return this.techModule.filename || '';
};
