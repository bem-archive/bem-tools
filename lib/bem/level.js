var fs = require('file'),
    os = require('os'),
    Tech = require('./tech').Tech;

exports.Level = function(path) {
    var _this = this,
        bemDir = (this.path = fs.path(path).absolute()).join('.bem');

    // NOTE: в директории .bem внутри уровня переопределения
    // может лежать модуль для уровня переопределения
    var level = {};
    try { level = require('' + bemDir.join('level.js')) } catch (e) {}
    for (var name in level)
        if (Object.prototype.hasOwnProperty.call(level, name))
            this[name] = level[name];

    for (var t in (this.techs = this.techs || {})) this.techs[t] = new Tech(t);
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
