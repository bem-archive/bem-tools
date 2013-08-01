'use strict';

var TechTest = require('./tech-test').TechTest;

/**
 * Creates functional test helper for technology module.
 *
 * @param {String} moduleName an absolute path to a module to test
 * @returns {TechTest}
 */
exports.testTech = function(modulePath) {
    return new TechTest(modulePath);
};
