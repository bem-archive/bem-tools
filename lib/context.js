var myPath = require('./path'),
    bemUtil = require('./util'),
    Tech = require('./tech').Tech,
    isRequireable = bemUtil.isRequireable;

var Context = function(levels, opts) {
    this.levels = !levels? [] : Array.isArray(levels)? levels : [levels];
    this.opts = opts || {};
    this.techs = this.initOptsTechs();
    this.techsCache = {};
};

Context.prototype.initOptsTechs = function() {
    var opts = this.opts,
        techs = {},
        pathToName = function(techIdent) {
            var techPath = this.resolveTech(techIdent),
                techName = bemUtil.isPath(techIdent)?
                    (new Tech(techPath)).getTechName() :
                    techIdent;
            techs[techName] = techPath;
            return techName;
        };
    opts.forceTech && (opts.forceTech = opts.forceTech.map(pathToName, this));
    opts.addTech && (opts.addTech = opts.addTech.map(pathToName, this));
    opts.noTech && (opts.noTech = opts.noTech.map(pathToName, this));
    opts.tech && (opts.tech = opts.tech.map(pathToName, this));
    return techs;
};

Context.prototype.getTech = function(name, path) {
    if(!this.techsCache.hasOwnProperty(name)) {
        this.techsCache[name] = this.createTech(name, path || name);
    }
    return this.techsCache[name];
};

Context.prototype.createTech = function(name, path) {
    return new Tech(this.resolveTech(path || name), name);
};

Context.prototype.resolveTech = function(techIdent) {
    return (bemUtil.isPath(techIdent) && this.resolveTechPath(techIdent)) ||
        (this.levels.length && this.resolveTechName(techIdent)) ||
        bemUtil.getBemTechPath(techIdent);
};

Context.prototype.resolveTechName = function(techIdent) {
    if(!this.levels.length) return;
    var techPath, level, i = this.levels.length;
    while(!techPath && (level = this.levels[--i])) {
        techPath = level.resolveTechName(techIdent);
    }
    return techPath;
};

Context.prototype.resolveTechPath = function(techPath) {
    // Относительный или абсолютный путь
    techPath = myPath.absolute(techPath);
    if(isRequireable(techPath)) {
        return techPath;
    }

    throw new Error("Tech module on path '" + techPath + "' not found");
};

Context.prototype.getTechs = function() {
    return this.opts.tech;
};

Context.prototype.getDefaultTechs = function() {
    // Список технологий по умолчанию с последнего уровня переопределения
    var defaultTechs = (!this.opts.forceTech && this.getLevel())? this.getLevel() : [],
        opts = this.opts;

    opts.forceTech && defaultTechs.push.apply(defaultTechs, opts.forceTech);
    opts.addTech && defaultTechs.push.apply(defaultTechs, opts.addTech);
    defaultTechs = bemUtil.arrayUnique(defaultTechs);
    opts.noTech && opts.noTech.forEach(function(t) {
        defaultTechs.splice(defaultTechs.indexOf(t), 1);
    });

    return defaultTechs;
};

Context.prototype.getLevels = function() {
    return this.levels;
};

Context.prototype.getLevel = function() {
    return this.levels[this.levels.length - 1];
};

exports.Context = Context;
