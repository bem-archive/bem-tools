'use strict';

var TechV1 = exports.Tech = require('./v1').Tech,
    TechV2 = exports.TechV2 = require('./v2').Tech,
    INHERIT = require('inherit'),
    PATH = require('path'),
    Q = require('q'),
    U = require('../util'),
    BEM,
    getBem = function() {
        if (!BEM) BEM = require('../..');

        return BEM;
    };

    /**
     * Return tech class for the tech module path.
     *
     * @param {String|Object} module  Path to tech module or module object.
     * @param {Level} [level]  Level object to resolve techs by name.
     * @returns {Tech}  Tech class.
     */
    var getTechClass = exports.getTechClass = function(module, level) {

        var tech = typeof module === 'string'? require(module) : module;

        if (typeof tech === 'function' && !tech.prototype.__self) tech = tech(getBem());

        var TechClass = tech.API_VER > 1 ? TechV2 : TechV1;

        // link to tech class found in Tech property
        if (tech.Tech) return tech.Tech;

        // path to base tech module found in baseTechPath property
        if (tech.baseTechPath) {
            TechClass = getTechClass(tech.baseTechPath, level);
        }

        // base tech name found in baseTechName property
        else if (tech.baseTechName) {
            if (!level) throw new Error('getTechClass(): level argument must be specified to resolve techs by name');
            TechClass = level.resolveTechClass(tech.baseTechName);
        }

        // link to base tech class found in baseTech property
        else if (tech.baseTech) {
            TechClass = tech.baseTech;
        }

        //if API_VER for tech is present, ensure its the same as for base tech
        if (typeof requiredVersion !== 'undefined') {
            var actualVersion = TechClass.prototype.API_VER || 1;

            if (requiredVersion !== actualVersion) {
                throw new Error('Expected base tech to have version ' +
                                requiredVersion + ', got ' + actualVersion);
            }
        }

        return INHERIT(TechClass, tech.techMixin || tech);
    };

/**
 * Create tech object for tech module, identified by name.
 * @param {String|Object} tech  Tech module absolute path or tech class.
 * @param {String} name  Tech name.
 * @param {Level} [level]  Level object to resolve techs by name.
 * @returns {Tech}  Tech instance object.
 */
exports.createTech = function(tech, name, level) {
    var Tech = typeof tech === 'string'? getTechClass(tech, level): tech;

    return new Tech(name, typeof tech === 'string'? tech: undefined);
};
