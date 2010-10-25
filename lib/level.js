var myPath = require('./path');
    Tech = require('./tech').Tech;

exports.Level = function(path) {
    this.bemDir = (this.path = myPath.join(myPath.absolute(path), '.bem'));

    // NOTE: в директории .bem внутри уровня переопределения
    // может лежать модуль для уровня переопределения
    var level = {};
    try {
        level = require(myPath.join(this.bemDir, 'level.js'));
    } catch (ignore) {}

    for(var i in level) level.hasOwnProperty(i) && (this[i] = level[i]);
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
    if (this.techs.hasOwnProperty(tech.getTechName())) {
        return this.techs[tech.getTechName()];
    }

    // Есть ли созданная технология с таким же абсолютным путём
    var techPaths = {};
    for(var i in this.techs)
        if(this.techs.hasOwnProperty(i)) {
            var t = this.techs[i];
            t.getTechPath() && (techPaths[t.getTechPath()] = t);
        }

    if (techPaths.hasOwnProperty(tech.getTechPath())) {
        return techPaths[tech.getTechPath()];
    }

    return this.createTech(name, path);
};

exports.Level.prototype.createTech = function (name, path) {
    return new Tech(this.resolveTechPath(path || name));
};

exports.Level.prototype.resolveTechPath = function (path) {
    // Получить абсолютный путь, если путь начинается с .
    // NOTE: заменить на !isAbsolute() нельзя
    if (/^\./.test(path)) {
        // Развернуть относительный путь начиная от директории .bem
        path = myPath.join(this.bemDir, '/', path);
    }
    return path;
};

exports.Level.prototype.get = function(what, args) {
    return myPath.join(myPath.dirname(this.path), this['get-' + what].apply(this, args));
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
