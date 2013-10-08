'use strict';

var defineLevel = require('../level').defineLevel;

exports.Level = defineLevel()
    .setNamingScheme('simple')
    .createClass();
