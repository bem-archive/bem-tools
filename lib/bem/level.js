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

    for (var t in (this.techs = this.techs || {})) {
        var path = this.techs[t] || t;
        // Получить абсолютный путь, если путь начинается с .
        if (/^\./.test(path)) {
            // Развернуть относительный путь начиная от директории .bem
            path = fs.path(this.bemDir).join('/').resolve(path);
        }
        var tech = new Tech(path);
        this.techs[tech.getTechName()] = tech;
    }
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
