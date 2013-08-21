'use strict';

var Insight = require('insight'),
    pkg = require('../package.json'),

    insight = new Insight({
        packageName: pkg.name,
        packageVersion: pkg.version,
        // bem-tools tracking code for Yandex.Metrica
        trackingCode: '21878344',
        trackingProvider: 'yandex'
    });

insight.trackCommand = function() {

    var path = [],
        c = this;
    while(c !== c._cmd) {
        path.unshift(c._name);
        c = c._cmd;
    }
    path.unshift('commands');

    return this.act(function() {
        if (this.isCli) insight.track.apply(insight, path);
    });

};

module.exports = insight;
