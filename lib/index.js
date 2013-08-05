var BEM = require('./coa'),
    LEVEL = require('./level'),
    TECH = require('./tech');

exports.version = require('../package.json').version;

exports.api = BEM.api;
exports.nodes = require('./nodes');

exports.Context = require('./context').Context;

exports.Tech = TECH.Tech;
exports.TechV2 = TECH.TechV2;
exports.getTechClass = TECH.getTechClass;
exports.createTech = TECH.createTech;

exports.Level = LEVEL.Level;
exports.createLevel = LEVEL.createLevel;

exports.template = require('./template');
exports.logger = require('./logger');
exports.util = require('./util');

exports.require = require;
