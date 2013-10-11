'use strict';

var defineLevel = require('../level').defineLevel;

exports.Level = defineLevel()
    .setNamingScheme('simple')
    .addTypes('project')
    .addTechs({
        'blocks': 'level-proto',
        'bundles': 'level-proto',
        'docs': 'level-proto'
    })
    .createClass();
