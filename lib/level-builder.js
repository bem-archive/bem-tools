'use strict';
var INHERIT = require('inherit'),
    bemUtil = require('./util'),
    Level = require('./level').Level;


/**
 * @classdesc Utility class indented to simplify
 * definition of the new level classes.
 */
function LevelBuilder(defaults) {
    defaults = defaults || {};
    var namingScheme = defaults.namingScheme,
        searchModules = defaults.searchModules || [],
        techMap = defaults.techMap || {},
        config = defaults.config || {},
        types = defaults.types || ['level'],
        defaultTechs = defaults.defaultTechs;


    /**
     * Adds npm module to search paths for technologies
     *
     * Module should export resolveTech function.
     * @param {String} moduleName npm package name.
     * @returns {LevelBuilder}
     * @memberof LevelBuilder.prototype
     */
    this.useNpmModule = function(moduleName) {
        searchModules.push(require(moduleName));
        return this;
    };

    /**
     * Sets bem entities naming scheme for level
     *
     * @param {String|Object} scheme standard scheme name or naming scheme mixin
     * @returns {LevelBuilder}
     * @memberof LevelBuilder.prototype
     */
    this.setNamingScheme = function(scheme) {
        if (typeof scheme === 'string') {
            scheme = loadNamingScheme(scheme);
        }
        namingScheme = scheme;
        return this;
    };

    function loadNamingScheme(scheme) {
        var bemLib = process.env.COVER? '../lib-cov/' : '../lib/';

        try {
            return require(bemLib + 'levels/naming/' + scheme);
        } catch (e) {
            throw new Error('Unknown naming scheme: "' + scheme + '"');
        }
    }

    /**
     * Sets non-standard level config
     *
     * @param {Object} newConfig a config to set. Can be any object.
     * @returns {LevelBuilder}
     * @memberof LevelBuilder.prototype
     */
    this.setConfig = function(newConfig) {
        config = newConfig;
        return this;
    };

    /**
     * Adds tech modules to techMap of the level.
     *
     * @param {(String|Object)...} tech tech name or map in format {name: path}.
     * If only name speciefied, module will be searched in following locations:
     * <ul>
     *  <li> $PROJECT_ROOT/.bem/techs.
     *  <li> npm packages, specified with useNpmModule.
     *  <li> V2 bem-tools techs
     * </ul>
     * @returns {LevelBuilder}
     * @memberof LevelBuilder.prototype
     */
    this.addTechs = function () {
        for (var arg in arguments) {
            var tech = arguments[arg];
            if (typeof tech === 'string') {
                var path = resolveNpmTech(tech);
                if (!path) {
                    path = require.resolve('./techs/v2/' + tech);
                }
                techMap[tech] = path;
            } else {
                bemUtil.extend(techMap, tech);
            }
        }

        return this;
    };

    function resolveNpmTech(tech) {
        var path;
        for (var i=0, nodeModule; nodeModule = searchModules[i]; i++) {
            //resolveTech might use require.resolve internally which
            //will throw exception if module not found.
            //We need to ignore such exceptions.
            try {
                path = nodeModule.resolveTech(tech);
                if (path) {
                    return path;
                }
            } catch(e) {
                continue;
            }
        }

    }

    /**
     * Sets default techs for a level
     *
     * @param {String[]} tech tech names for default techs.
     * @returns {LevelBuilder}
     * @memberof LevelBuilder.prototype
     */
    this.setDefaultTechs = function(techs) {
        defaultTechs = techs;
        return this;
    };

    /**
     * Adds types to level class. Type is a sort of tag, that
     * can be used to find a specific level.
     *
     * @param {String...} types an array of types to add
     * @returns {LevelBuilder}
     * @memberof LevelBuilder.prototype
  
     */
    this.addTypes = function() {
        for (var i in arguments) {
            types.push(arguments[i]);
        }
        return this;
    };

    /**
     * Finishes construction and creates a level class
     *
     * @returns {Level}
     * @memberof LevelBuilder.prototype
     */
    this.createClass = function () {
        var mixin = bemUtil.extend({}, namingScheme, {
            getTechs: function() {
                return techMap;
            },

            getTypes: function() {
                return types;
            },

            getConfig: function() {
                return config;
            }
        });

        if (defaultTechs) {
            mixin.getDefaultTechs = function() {
                return defaultTechs;
            };
        }

        return INHERIT(Level, mixin, {
            extend: function() {
                return new LevelBuilder({
                    namingScheme: namingScheme,
                    searchModules: [].concat(searchModules),
                    techMap: bemUtil.extend({}, techMap),
                    config: config,
                    types: [].concat(types),
                    defaultTechs: defaultTechs
                });
            }
        });
    };
}

/**
 * Defines a new level class
 *
 * @returns {LevelBuilder}
 */
exports.defineLevel = function() {
    return new LevelBuilder();
};

exports.LevelBuilder = LevelBuilder;

