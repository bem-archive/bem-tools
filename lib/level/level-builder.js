'use strict';
var PATH = require('path'),
    INHERIT = require('inherit'),
    bemUtil = require('../util'),
    ENV = require('../env'),
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
        types = defaults.types || ['level'],
        bundleBuildLevels = defaults.bundleBuildLevels,
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
        try {
            return require('./naming/' + scheme);
        } catch (e) {
            throw new Error('Unknown naming scheme: "' + scheme + '"');
        }
    }

    /**
     * Sets levels to build for bundle level
     *
     * @param {String...} levels levels to build bundle from
     * @returns {LevelBuilder}
     * @memberof LevelBuilder.prototype
     */
    this.setBundleBuildLevels = function() {
        bundleBuildLevels = Array.prototype.slice.call(arguments);
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
                var path =
                    resolveProjectTech(tech) ||
                    resolveNpmTech(tech) ||
                    resolveBemToolsTech(tech);

                if (!path) {
                    throw new Error('Unable to resolve tech "' + tech + '" by name');
                }
                techMap[tech] = path;
            } else {
                bemUtil.extend(techMap, tech);
            }
        }

        return this;
    };

    function resolveProjectTech(tech) {
        var path = getProjectTechPath(tech);
        if (isTechModule(path)) {
            return path;
        }
    }

    function getProjectTechPath(tech) {
        var root = ENV.getEnv('root') || process.cwd();
        return PATH.join(root, '.bem', 'techs', tech) + '.js';
    }

    function isTechModule(path) {
        try {
            var module = require(path);
            return module.techMixin || module.Tech;
        } catch(ignore) {
            return false;
        }
    }

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

    function resolveBemToolsTech(tech) {
        try {
            return require.resolve('../techs/v2/' + tech);
        } catch (ignore) {
        }
    }

    /**
     * Sets default techs for a level
     *
     * @param {String...} techs tech names for default techs.
     * @returns {LevelBuilder}
     * @memberof LevelBuilder.prototype
     */
    this.setDefaultTechs = function() {
        defaultTechs = Array.prototype.slice.call(arguments);
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
            }
        });

        if (bundleBuildLevels) {
            mixin.getConfig = function() {
                return {
                    bundleBuildLevels: bundleBuildLevels
                };
            };
        }

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
                    bundleBuildLevels: bundleBuildLevels,
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

