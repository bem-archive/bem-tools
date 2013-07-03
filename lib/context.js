'use strict';

var PATH = require('./path'),
    INHERIT = require('inherit'),
    bemUtil = require('./util'),
    createTech = require('./tech').createTech,
    isRequireable = bemUtil.isRequireable;

exports.Context = INHERIT({

    __constructor: function(level, opts) {
        var levels = opts.level;
        this.level = level;
        this.levels = !levels? [] : Array.isArray(levels)? levels : [levels];
        this.opts = opts || {};
        this.techs = this.initOptsTechs();
        this._techsCache = {};
    },

    initOptsTechs: function() {
        var opts = this.opts,
            techs = {},
            pathToName = function(techIdent) {
                var techPath = this.resolveTech(techIdent),
                    techName = bemUtil.isPath(techIdent)?
                        createTech(techPath, null, this.getLevel()).getTechName() :
                        techIdent;
                techs[techName] = techPath;
                return techName;
            };
        opts.forceTech && (opts.forceTech = opts.forceTech.map(pathToName, this));
        opts.addTech && (opts.addTech = opts.addTech.map(pathToName, this));
        opts.noTech && (opts.noTech = opts.noTech.map(pathToName, this));
        opts.tech && (opts.tech = opts.tech.map(pathToName, this));
        return techs;
    },

    getTech: function(name, path) {
        if(!this._techsCache.hasOwnProperty(name)) {
            this._techsCache[name] = this.createTech(name, path || name);
        }
        return this._techsCache[name];
    },

    createTech: function(name, path) {
        return createTech(this.resolveTech(path || name), name, this.getLevel()).setContext(this);
    },

    resolveTech: function(techIdent) {
        return (bemUtil.isPath(techIdent) && this.resolveTechPath(techIdent)) ||
            this.resolveTechName(techIdent) ||
            bemUtil.getBemTechPath(techIdent);
    },

    resolveTechName: function(techIdent) {
        // NOTE: this.techs has not been initialized when resolveTechName() called
        // from initOptsTechs(). It is not so good as it could be, need to rethink.
        var techPath = this.techs? this.techs[techIdent] : null;
        if(techPath || !this.getLevel()) return techPath;
        return this.getLevel().resolveTechName(techIdent);
    },

    /* jshint -W109 */
    resolveTechPath: function(techPath) {
        // Относительный или абсолютный путь
        techPath = PATH.absolute(techPath);
        if(isRequireable(techPath)) {
            return techPath;
        }

        throw new Error("Tech module on path '" + techPath + "' not found");
    },
    /* jshint +W109 */

    getTechs: function() {
        return this.opts.tech;
    },

    getDefaultTechs: function() {
        // Список технологий по умолчанию с последнего уровня переопределения
        var defaultTechs = (!this.opts.forceTech && this.getLevel())?
                this.getLevel().getDefaultTechs() : [],
            opts = this.opts;

        opts.forceTech && defaultTechs.push.apply(defaultTechs, opts.forceTech);
        opts.addTech && defaultTechs.push.apply(defaultTechs, opts.addTech);
        defaultTechs = bemUtil.arrayUnique(defaultTechs);
        opts.noTech && opts.noTech.forEach(function(t) {
            defaultTechs.splice(defaultTechs.indexOf(t), 1);
        });

        return defaultTechs;
    },

    getLevels: function() {
        return this.levels;
    },

    getLevel: function() {
        return this.level;
    }

});
