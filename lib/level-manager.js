/*global -Map*/
'use strict';
var PATH = require('path'),
    U = require('util'),
    INHERIT = require('inherit'),
    minimatch = require('minimatch'),
    Map = require('collections/map'),
    bemUtil = require('./util'),
    DefaultLevelClass,
    BEM,

    // Use this as a function because of circular dependency which occurs
    // if require is placed in the global scope of the module. BEM and DefaultLevelClass are 
    // also cached in a var to avoid require call every time (which is much slower than if
    // statement.
    getBem = function() {
        if (!BEM) BEM = require('..');

        return BEM;
    },

    getDefaultLevel = function() {
        if (!DefaultLevelClass) DefaultLevelClass = require('./level.js').Level;
        return DefaultLevelClass;
    };

var instance;

/**
 * @class LevelManager Storage for level prototypes and factory for levels.
 */
function LevelManager () {
    //map is used instead of plain object, because it guarantees that
    //keys will be iterated in order of addition
    var patterns = new Map();
    var cache = {};

    /**
     * Sets a level class to use for all paths that match given pattern.
     *
     * @param {String} pattern glob pattern to match paths against
     * @param {Object} levelClass class of a level to create for matched
     * patterns. Must be a subclass of Level
     * @memberOf LevelManager.prototype
     */
    this.setLevelClass = function(pattern, levelClass) {
        patterns.set(pattern, levelClass);
    };

    /**
     * Creates a new level from a path on a system.
     *
     * If there is .bem/level.js file in a root directory of a level it
     * will be used as level prototype. Otherwise, path will be matched
     * against list of patterns registered with setLevelClass methods and
     * first match will be used. If no mathes found, default level class
     * will be used.
     *
     * @param {String} path path on a filesystem
     * @param {Object} opts options
     * @param {Boolean} opts.noCache reload level instance even if its
     * cached. 
     */
    this.createLevel = function(path, opts) {
        opts = opts || {};
        if (!opts.noCache && cache[path]) {
            return cache[path];
        }
        var LevelClass;
        var levelJSPAth = PATH.join(path, '.bem', 'level.js');
        if (bemUtil.isRequireable(levelJSPAth)) {
            LevelClass = getLevelClass(levelJSPAth, []);
        } else {
            LevelClass = findMatchedLevel(path);
            if (!LevelClass) {
                LevelClass = getDefaultLevel();
            }
        }
        cache[path] = new LevelClass(path, opts);
        return cache[path];
    };

    function getLevelClass(path, stack) {
        var mixin = getLevelMixin(path, stack);
        stack.push(path);

        if (isLevelClass(mixin)) {
            return mixin;
        }

        if (isLevelClass(mixin.Level)) {
            return mixin.Level;
        }
        
        return INHERIT(getLevelBaseClass(mixin, stack), mixin);
    }

    function getLevelMixin(path, stack) {
        var mixin;
        try {
            mixin = requireLevel(path);
        } catch(e) {
            throw new Error(U.format(
                'level module %s can not be found %s %s%s\n',
                path,
                stack.length > 0? 'but required by the level': '',
                stack.length > 1? 'inheritance tree:\n\t': '',
                stack.join('\n\t')));
        }

        if (typeof mixin === 'function') {
            mixin = mixin(getBem());
        }
        return mixin;
    }

    function isLevelClass(object) {
        if (typeof object !== 'object') {
            return object;
        }
        var Level = getDefaultLevel(),
            proto = Object.getPrototypeOf(object);

        return proto === Level.prototype || proto instanceof Level;
    }

    function requireLevel(path) {
        return bemUtil.requireWrapper(require)(path, true);
    }

    function getLevelBaseClass(mixin, stack) {
        var baseLevelPath;
        if (mixin.baseLevelName) {
            baseLevelPath = PATH.join(__dirname, 'levels', mixin.baseLevelName);
        } else {
            baseLevelPath = mixin.baseLevelPath;
        }
        var BaseClass;
        if (baseLevelPath) {
            return getLevelClass(baseLevelPath, stack);
        } else {
            return getDefaultLevel();
        }
    }

    function findMatchedLevel(path) {
        var foundClass;
        patterns.forEach(function(levelClass, pattern) {
            if (minimatch(path, pattern, {matchBase: true})) {
                foundClass = levelClass;
            }
        });
        return foundClass;
    }

    /**
     * Resets file cache on loaded levels.
     *
     * @param {Boolean} allLevels if set will reset cache on all levels. If not,
     * will reset only those levels which have false cache flag.
     */
    this.resetFilesCache = function(allLevels) {
        for(var l in cache) {
            var level = cache[l];

            if (!level.cache || allLevels) level.files = null;
        }
    };
}

LevelManager.get = function() {
    if (!instance) {
        instance = new LevelManager();
    }
    return instance;
};

module.exports = LevelManager;
