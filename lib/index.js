var BEM = require('./coa'),
    LEVEL = require('./level'),
    TECH = require('./tech');

exports.version = require('../package.json').version;

exports.api = BEM.api;
exports.nodes = require('./nodes');

exports.Context = require('./context').Context;

exports.Tech = TECH.Tech;
exports.getTechClass = TECH.getTechClass;
exports.createTech = TECH.createTech;

exports.Level = LEVEL.Level;
exports.createLevel = LEVEL.createLevel;

exports.util = require('./util');

exports.require = require;
