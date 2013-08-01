'use strict';

var INHERIT = require('inherit'),
    Level = require('../level').Level;

module.exports = INHERIT(Level, /** @lends StubLevel.prototype */{


    /**
     * Creates new instance.
     *
     * @class StubLevel Special stub level to use in technology functional tests.
     * Created for one specific tech. Differences with regular levels.
     * Differences with regular level:
     *
     * <ul>
     *  <li> project root is always at /
     *  <li> getTechs always returns one technology given at constructor.
     *  <li> createTech always returns the same technology.
     * </ul> 
     *
     * @private
     * @constructs
     * @param {String} path a path to the level
     * @param {Tech} tech technology to create level for
     */
    __constructor: function(path, tech) {
        this.__base(path, {projectRoot: '/'});
        this._testTech = tech;

    },

    getTechs: function() {
        var result = {};
        result[this._testTech.getTechName()] = this._testTech.getTechPath();
        return result;
    },

    createTech: function() {
        return this._testTech;
    }
});
