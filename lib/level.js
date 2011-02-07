var myPath = require('./path');
    Tech = require('./tech').Tech;
    bemUtil = require('./util'),
    isRequireable = bemUtil.isRequireable,
    isRequireError = bemUtil.isRequireError;

exports.Level = function(path) {
    this.path = myPath.join(myPath.absolute(path), '.bem');

    // NOTE: в директории .bem внутри уровня переопределения
    // может лежать модуль для уровня переопределения
    var level = {};
    try {
        level = require(myPath.join(this.path, 'level.js'));
    } catch (e) {
        if(!isRequireError(e)) throw e;
    }

    for(var i in level) level.hasOwnProperty(i) && (this[i] = level[i]);
    this.techs = this.initTechs(this.techs || {});
    this.techsCache = {};
};

exports.Level.prototype.initTechs = function(desc) {
    var techs = {};
    for(var t in desc) {
        techs[t] = this.resolveTech(desc[t], true);
    }
    return techs;
};

exports.Level.prototype.getTech = function(name, path) {
    path = path || name;
    if(!this.techsCache.hasOwnProperty(name)) {
        this.techsCache[name] = this.createTech(name, path);
    }
    return this.techsCache[name];
};

exports.Level.prototype.createTech = function(name, path) {
    var path = path || name;
    return new Tech(this.resolveTech(path), name);
};

exports.Level.prototype.resolveTech = function(techIdent, force) {
    if(bemUtil.isPath(techIdent)) {
        return this.resolveTechPath(techIdent);
    }
    if(!force && this.techs.hasOwnProperty(techIdent)) {
        return this.techs[techIdent];
    }
    return bemUtil.getBemTechPath(techIdent);
};

exports.Level.prototype.resolveTechPath = function(techPath) {
    // Получить абсолютный путь, если путь начинается с .
    // NOTE: заменить на !isAbsolute() нельзя
    if(techPath.substring(0, 1) === '.') {
        // Развернуть относительный путь начиная от директории .bem
        techPath = myPath.join(this.path, '/', techPath);
        if(!isRequireable(techPath)) {
            throw new Error("Tech module on path '" + techPath + "' not found");
        }
        return techPath;
    }

    // Пробуем абсолютный или относительный путь без .
    if(isRequireable(techPath)) {
        return techPath;
    }

    throw new Error("Tech module with path '" + techPath + "' not found on require.paths");
};

exports.Level.prototype.getDefaultTechs = function() {
    if(this.defaultTechs) return this.defaultTechs;
    var defaultTechs = [];
    for(var key in this.techs) this.techs.hasOwnProperty(key) && defaultTechs.push(key);
    return defaultTechs;
}

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

// Интроспекция по файловой системе
/*
exports.Level.prototype.getBlockFromFileSys = function(blockName) {
    return {
        name: blockName,
        //mods: this.getModsFromFileSys(blockName),
        //elems: this.getElemsFromFileSys(blockName),
        //examples: this.getExamplesFromFileSys(blockName),
        //labels: this.getLabelsFromFileSys(blockName)
    };
};

exports.Level.prototype.getElemsFromFileSys = function(blockName) {
    var _this = this;
    return this.getElemNamesFromDirs(blockName).map(function(elemName) {
        var elemFilePrefix = _this.getElemFilePrefix(elemName, blockName);
        return {
            name: elemName,
            //title: readFile(elemFilePrefix + '.title.txt'),
            //desc: readFile(elemFilePrefix + '.desc.wiki'),
            //mods: _this.getModsFromFileSys(blockName, elemName),
            //examples: _this.getExamplesFromFileSys(blockName, elemName)
        };
    });
};

exports.Level.prototype.getElemNamesFromDirs = function(blockName) {
    return this.getDirs(this.getBlockDir(blockName))
        .filter(this.isElemName)
        .map(function(n){ return n.replace(/^__/, '') });
};
*/
