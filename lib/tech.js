var fs = require('fs'),
    sys = require('sys'),
    os = require('os'),
    bemUtil = require('./util'),
    myPath = require('./path'),
    isRequireError = bemUtil.isRequireError;

exports.Tech = function(path, techName) {
    this.path = path;
    var tech = require(this.path);
    for(var i in tech) tech.hasOwnProperty(i) && (this[i] = tech[i]);
    if(techName) this.techName = techName;
};

exports.Tech.setContext = function(ctx) {
    exports.Tech.prototype.context = ctx;
};

exports.Tech.prototype.setContext = function(ctx) {
    this.context = ctx;
    return this;
};

exports.Tech.prototype.getContext = function() {
    return this.context;
};

exports.Tech.prototype.bemBuild = function(prefixes, outputDir, outputName) {
    var _this = this,
        content = this.filterExists(prefixes)
            .map(function(file) {
                return _this.outFile(
                    myPath.relative(outputDir, file),
                    file, outputDir, outputName);
            });

    fs.createWriteStream(
            this.fileByPrefix(myPath.join(outputDir, outputName)),
            { encoding: 'utf8' })
        .write(content.join(''));

    return this;
};

exports.Tech.prototype.bemCreate = function(prefix, vars) {
    var file = this.fileByPrefix(prefix);
    bemUtil.isFile(file) && sys.error('Уже существует ' + file);
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

exports.Tech.prototype.getTechName = function() {
    if(this.techName) return this.techName;
    return myPath.basename(this.getTechPath());
};

exports.Tech.prototype.getFileSuffix = function() {
    return '.' + this.getTechName();
};

exports.Tech.prototype.fileByPrefix = function(prefix) {
    return prefix + this.getFileSuffix();
};

exports.Tech.prototype.matchSuffix = function(suffix) {
    return this.getFileSuffix() == suffix;
};

exports.Tech.prototype.outFile = function(file) {
    return file + '\n';
};

exports.Tech.prototype.newFileContent = function() {
    return '';
};

exports.Tech.prototype.getFileContent = function(prefix) {
    var file = this.fileByPrefix(prefix);
    if(bemUtil.isFile(file)) {
        return fs.readFileSync(file, 'utf8');
    }
    sys.error('Нет файла ' + file);
    return '';
};

exports.Tech.prototype.getTechRelativePath = function(bemPath) {
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
    bemPath = myPath.join(bemPath || '.', '/');
    var shortestPath = myPath.relative(bemPath, absPath);
    var paths = process.env.NODE_PATH.split(os.platform() === 'windows' ? ';' : ':');
    paths.forEach(function(reqPath) {
        var relPath = myPath.relative(myPath.join(reqPath, '/'), absPath);
        if(relPath.length < shortestPath.length) {
            shortestPath = relPath;
        }
    });

    return shortestPath;
};

exports.Tech.prototype.getTechPath = function() {
    return this.techModule.filename.replace(/\.(js|node)$/, '');
};
