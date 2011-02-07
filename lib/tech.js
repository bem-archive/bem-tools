var fs = require('fs'),
    bemUtil = require('./util'),
    myPath = require('./path'),
    isRequireError = bemUtil.isRequireError;

/*exports.resolveTechModule = function(path) {
    // Модуль технологии по имени
    try {
        return require('./techs/' + path);
    } catch (e) {
        if(! isRequireError(e)) throw e;
    }

    // Модуль технологии по относительному или абсолютному пути
    try {
        // NOTE: символические ссылки не разворачиваются
        return require(myPath.absolute(path));
    } catch (e) {
        if(! isRequireError(e)) throw e;
    }

    // Модуль технологии по пути относительно require.paths
    try {
        return require(path);
    } catch (e) {
        if(! isRequireError(e)) throw e;
    }

    // fallback: Не существующая в явном виде технология, в некотором роде default
    return {
        // FIXME: Подумать, что возвращать вместо фейка объекта модуля
        techModule: {
            id: myPath.basename(path, '.js'),
            filename: path
        }
    };
};*/

exports.Tech = function(path, techName) {
    this.path = path;
    var tech = require(this.path);
    for(var i in tech) tech.hasOwnProperty(i) && (this[i] = tech[i]);
    if(techName) this.techName = techName;
};

exports.Tech.setContext = function(ctx) {
    exports.Tech.prototype.context = ctx;
};

exports.Tech.prototype.getContext = function() {
    return this.context;
};

exports.Tech.prototype.bemBuild = function(prefixes, outputDir, outputName) {
    var _this = this,
        content = this.filterExists(prefixes)
            .map(function(file) {
                return myPath.relative(outputDir, file);
            })
            .map(function(file) {
                return _this.outFile(file);
            });

    fs.createWriteStream(
            myPath.join(outputDir, outputName + '.' + _this.getTechName()),
            { encoding: 'utf8' })
        .write(content.join(''));

    return this;
};

exports.Tech.prototype.bemCreate = function(prefix, vars) {
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

exports.Tech.prototype.filterExists = function(prefixes) {
    var _this = this,
        res = [];
    prefixes.forEach(function(prefix){
        var file = _this.fileByPrefix(prefix);
        bemUtil.isFile(file) && res.push(file);
    });
    return res;
};

exports.Tech.prototype.fileByPrefix = function(prefix) {
    return prefix + '.' + this.getTechName();
};

exports.Tech.prototype.outFile = function(file) {
    return file + '\n';
};

exports.Tech.prototype.newFileContent = function() {
    return '';
};

exports.Tech.prototype.getTechName = function() {
    if(this.techName) return this.techName;
    return myPath.basename(this.techModule.filename, '.js');
};

exports.Tech.prototype.getTechRelativePath = function(bemPath) {
    // TODO: пересмотреть
    var bemPath = myPath.join(bemPath, '/'),
        absPath = this.getTechPath();

    // NOTE: Если путь до технологии пустой, значит используется
    // реализация технологии по-умолчанию, и путь надо оставить пустым
    if(!absPath) return '';

    // FIXME: лучше искать «короткий путь», обдумать критерии такого пути
    var shortestPath = myPath.relative(bemPath, absPath);
    require.paths.forEach(function(reqPath) {
        var relPath = myPath.relative(myPath.join(reqPath, '/'), absPath);
        if(relPath.length < shortestPath.length) {
            shortestPath = relPath;
        }
    });

    return shortestPath;
};

exports.Tech.prototype.getTechPath = function() {
    return this.techModule.filename;
};
