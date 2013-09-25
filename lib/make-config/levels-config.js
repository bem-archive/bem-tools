'use strict';

var defineLevel = require('../level-builder').defineLevel;

module.exports = function LevelsConfig(levelManager) {
    //TODO: tests
    var currentPattern,
        currentBuilder,
        globalModules = [];
    
    this.addLevel = function(pattern, opts) {
        opts = opts || {};
        currentPattern = pattern;

        if (opts.extends) {
            currentBuilder = getBuilderByPattern(opts.extends);
        } else {
            currentBuilder = defineLevel();
        }

        globalModules.forEach(function(module) {
            currentBuilder.useNpmModule(module);
        });
        return this;
    };

    function getBuilderByPattern(pattern) {
        var LevelClass = levelManager.getLevelClass(pattern);
        if (!LevelClass) {
            throw new Error('There is no level class registered for pattern ' + pattern);
        }

        if (!LevelClass.extend) {
            throw new Error('Only levels defined with level builder can be extended in config');
        }

        return LevelClass.extend();
    }

    this.useNpmModule = function(module) {
        if (!currentBuilder) {
            globalModules.push(module);
        } else {
            currentBuilder.useNpmModule(module);
        }
        return this;
    };

    this.addTechs = builderProxy('addTechs');
    this.setNamingScheme = builderProxy('setNamingScheme');
    this.setConfig = builderProxy('setConfig');
    this.setDefaultTechs = builderProxy('setDefaultTechs');
    this.addTypes = builderProxy('addTypes');

    function builderProxy(name) {

        return function() {
            if (!currentBuilder) {
                throw new Error('You should call .addLevel before .' + name);
            }
            currentBuilder[name].apply(currentBuilder, arguments);

            levelManager.setLevelClass(currentPattern, currentBuilder.createClass());

            return this;
        };

    }
};
