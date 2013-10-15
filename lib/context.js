'use strict';

var PATH = require('./path'),
    INHERIT = require('inherit'),
    bemUtil = require('./util'),
    createTech = require('./tech').createTech,
    TECH = require('./tech'),
    isRequireable = bemUtil.isRequireable;

exports.Context = INHERIT({

    __constructor: function(level, opts) {
        var levels = opts.level;
        this.level = level;
        this.levels = !levels? [] : Array.isArray(levels)? levels : [levels];
        this.opts = opts || {};
        this.techs = this.initOptsTechs();
    },

    initOptsTechs: function() {

        var opts = this.opts,
            techs = {},
            pathToName = function(techIdent) {
                var techName = techIdent;
                if (bemUtil.isPath(techName)) techName = bemUtil.stripModuleExt(PATH.basename(techName));

                techs[techName] = this.createTech(techName, techIdent);
                return techName;
            };
        opts.forceTech && (opts.forceTech = opts.forceTech.map(pathToName, this));
        opts.addTech && (opts.addTech = opts.addTech.map(pathToName, this));
        opts.noTech && (opts.noTech = opts.noTech.map(pathToName, this));
        opts.tech && (opts.tech = opts.tech.map(pathToName, this));

        return techs;
    },

    getTech: function(name, path) {
        if(!this.techs.hasOwnProperty(name)) {
            this.techs[name] = this.createTech(name, path);
        }
        return this.techs[name];
    },

    createTech: function(name, path) {
        if (this.getLevel()) {
            return createTech(
                    this.getLevel().resolveTechClass(name),
                    name,
                    this.getLevel()
                ).setContext(this);
        }

        return TECH.createTech(this.resolveTech(path || name), name);
    },

    resolveTech: function(techIdent) {
        return (typeof techIdent !== 'string' && techIdent) ||
            (bemUtil.isPath(techIdent) && this.resolveTechPath(techIdent)) ||
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
