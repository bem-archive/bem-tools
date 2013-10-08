'use strict';

var defineLevel = require('../level').defineLevel;

exports.Level = defineLevel()
    .setNamingScheme('simple')
    .addTypes('project')
    .addTechs('blocks', 'bundles', 'docs')
    .createClass();
