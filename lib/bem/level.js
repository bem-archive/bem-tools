var fs = require('file'),
    os = require('os'),
    util = require('util'),
    Tech = require('./tech').Tech;

exports.Level = function(path) {
    this.bemDir = (this.path = fs.path(path).absolute()).join('.bem');

    // NOTE: в директории .bem внутри уровня переопределения
    // может лежать модуль для уровня переопределения
    var level = {};
    try {
        level = require('' + this.bemDir.join('level.js'));
    } catch (ignore) {}

    util.object.update(this, level);
    this.techs = this.initTechs(this.techs || {});
};

exports.Level.prototype.initTechs = function (desc) {
    var techs = {};
    for (var t in desc) {
        var tech = this.createTech(t, desc[t]);
        techs[tech.getTechName()] = tech;
    }
    return techs;
};

exports.Level.prototype.getTech = function (name, path) {
    var path = this.resolveTechPath(path || name),
        tech = this.createTech(name, path);

    // Есть ли созданная технология с таким же именем
    if (util.object.has(this.techs, tech.getTechName())) {
        return this.techs[tech.getTechName()];
    }

    // Есть ли созданная технология с таким же абсолютным путём
    var techPaths = util.object(util.object.items(this.techs).map(function (t) {
            return [t[1].getTechPath(), t[1]];
        }));

    if (util.object.has(techPaths, tech.getTechPath())) {
        return techPaths[tech.getTechPath()];
    }

    return this.createTech(name, path);
};

exports.Level.prototype.createTech = function (name, path) {
    var path = this.resolveTechPath(path || name);
    return new Tech(path);
};

exports.Level.prototype.resolveTechPath = function (path) {
    // Получить абсолютный путь, если путь начинается с .
    // NOTE: заменить на !fs.isAbsolute() нельзя
    if (/^\./.test(path)) {
        // Развернуть относительный путь начиная от директории .bem
        path = fs.path(this.bemDir).join('/').resolve(path);
    }
    return path;
};

exports.Level.prototype.get = function(what, args) {
    return this.path.join(this['get-' + what].apply(this, args));
};

exports.Level.prototype['get-block'] = function(block) {
    return [block, block].join('/');
};

exports.Level.prototype['get-block-mod'] = function(block, mod) {
    return [block,
           '_' + mod,
           block + '_' + mod].join('/');
};

exports.Level.prototype['get-block-mod-val'] = function(block, mod, val) {
    return [block,
           '_' + mod,
           block + '_' + mod + '_' + val].join('/');
};

exports.Level.prototype['get-elem'] = function(block, elem) {
    return [block,
           '__' + elem,
           block + '__' + elem].join('/');
};

exports.Level.prototype['get-elem-mod'] = function(block, elem, mod) {
    return [block,
        '__' + elem,
        '_' + mod,
        block + '__' + elem + '_' + mod].join('/');
};

exports.Level.prototype['get-elem-mod-val'] = function(block, elem, mod, val) {
    return [block,
        '__' + elem,
        '_' + mod,
        block + '__' + elem + '_' + mod + '_' + val].join('/');
};
