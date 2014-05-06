'use strict';

var BORSCHIK_CSS_TECH = require('borschik/lib/techs/css'),
    Q = require('q');

exports.baseTechPath = require.resolve('./css.js');

exports.techMixin = {

    getBuildSuffixesMap: function() {
        return {
            css: ['css']
        };
    },

    processBuildResult : function(res) {
        var defer = Q.defer();

        if (!res) {
            defer.resolve([]);
            return defer.promise;
        }

        this.compileBuildResult(res, defer);

        return defer.promise;
    },

    /* stub method, override in your tech's code */
    compileBuildResult: function(res, defer) {
        return defer.resolve([]);
    },

    getBuildResult : function(filteredFiles, destSuffix, output, opts) {
        return this.__base.apply(this, arguments)
            .then(function(res) {
                // use borschik here to preserve correct link to the images
                var tech = new BORSCHIK_CSS_TECH.Tech({
                        comments : true,
                        freeze : false,
                        minimize : false
                    }),
                    file = new BORSCHIK_CSS_TECH.File(tech, output, 'include');

                file.content = file.parse(res.join(''));

                return this.processBuildResult(file.process(output));
            }.bind(this));
    }

};
