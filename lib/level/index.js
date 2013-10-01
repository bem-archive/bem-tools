'use strict';

var LEVEL = require('./level'),
    LevelManager = require('./level-manager'),
    levelManager = LevelManager.get();

exports.Level = LEVEL.Level;
exports.LevelManager = LevelManager;
exports.defineLevel = require('./level-builder').defineLevel;

exports.setCachePolicy = LEVEL.setCachePolicy;


//for backward compatability
/**
 * Create level object from path on filesystem.
 *
 * @param {String | Object} level Path to level directory.
 * @param {Object} [opts] Optional parameters
 * @return {Level}  Level object.
 */
exports.createLevel = function(level, opts) {
    return levelManager.createLevel(level.path || level, opts);
};

exports.resetLevelsCache = function(all) {
    levelManager.resetFilesCache(all);
};

