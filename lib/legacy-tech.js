'use strict';

var FS = require('fs'),
    UTIL = require('util'),
    bemUtil = require('./util'),
    PATH = require('./path');

exports.Tech = function(path, techName) {
    this.path = path;
    var tech = require(this.path);
    for(var i in tech) tech.hasOwnProperty(i) && (this[i] = tech[i]);
    if(techName) this.techName = techName;
};

exports.Tech.prototype.old = true;

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
                    PATH.relative(outputDir, file),
                    file, outputDir, outputName);
            });

    var filename = this.fileByPrefix(PATH.join(outputDir, outputName));
    FS.writeFileSync(filename, content.join(''));
};

exports.Tech.prototype.bemCreate = function(prefix, vars, force) {
    var file = this.fileByPrefix(prefix);
    if(bemUtil.isFile(file) && !force) {
        UTIL.error('Уже существует ' + file);
        return;
    }
    bemUtil.mkdirs(PATH.dirname(file));
    FS.writeFileSync(file, this.newFileContent(vars));
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
    return bemUtil.stripModuleExt(PATH.basename(this.getTechPath()));
};

exports.Tech.prototype.getFileSuffix = function() {
    return '.' + this.getTechName();
};

exports.Tech.prototype.fileByPrefix = function(prefix) {
    return prefix + this.getFileSuffix();
};

exports.Tech.prototype.matchSuffix = function(suffix) {
    return this.getFileSuffix() === suffix;
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
        return FS.readFileSync(file, 'utf8');
    }
    //UTIL.error('Нет файла ' + file);
    return '';
};

exports.Tech.prototype.getTechRelativePath = function(from) {
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
    if(techPath === bemUtil.getBemTechPath('default')) return '';
    return techPath;
};

exports.Tech.prototype.getTechPath = function() {
    return this.techModule.filename;
};
