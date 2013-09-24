'use strict';

var defineLevel = require('../level-builder').defineLevel;

exports.Level = defineLevel()
    .setNamingScheme('simple')
    .createClass();
