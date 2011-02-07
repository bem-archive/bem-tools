var myPath = require('./path'),
    bemUtil = require('./util'),
    Tech = require('./tech').Tech,
    isRequireable = bemUtil.isRequireable;

var Context = function(level, opts) {
    this.level = level;
    this.opts = opts || {};
    this.techs = this.initOptsTechs();
    this.techsCache = {};
}

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
    opts.addTech   && (opts.addTech   = opts.addTech.map(pathToName, this));
    opts.noTech    && (opts.noTech    = opts.noTech.map(pathToName, this));
    return techs;
};

Context.prototype.getTech = function(name, path) {
    path = path || name;
    if(! this.techsCache.hasOwnProperty(name)) {
        this.techsCache[name] = this.createTech(name, path);
    }
    return this.techsCache[name];
};

Context.prototype.createTech = function(name, path) {
    var path = path || name;
    return new Tech(this.resolveTech(path), name);
};

Context.prototype.resolveTech = function(techIdent) {
    if(bemUtil.isPath(techIdent)) {
        return this.resolveTechPath(techIdent);
    }
    if(this.level) {
        return this.level.resolveTech(techIdent);
    }
    return bemUtil.getBemTechPath(techIdent);
};

Context.prototype.resolveTechPath = function(techPath) {
    // Относительный или абсолютный путь
    techPath = myPath.absolute(techPath);
    if(isRequireable(techPath)) {
        return techPath;
    }

    throw new Error("Tech module on path '" + techPath + "' not found");
};

Context.prototype.getDefaultTechs = function() {
    var defaultTechs = (!this.opts.forceTech && this.level)? this.level.getDefaultTechs() : [],
        opts = this.opts;

    opts.forceTech && defaultTechs.push.apply(defaultTechs, opts.forceTech);
    opts.addTech && defaultTechs.push.apply(defaultTechs, opts.addTech);
    defaultTechs = bemUtil.arrayUnique(defaultTechs);
    opts.noTech && opts.noTech.forEach(function(t) {
        defaultTechs.splice(defaultTechs.indexOf(t), 1);
    });

    return defaultTechs;
};


exports.Context = Context;
