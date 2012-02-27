var Q = require('q'),
    QFS = require('q-fs'),
    CORE = require('samurai'),
    PATH = require('path'),
    UTIL = require('util');

exports.DEFAULT_JOBS = 10;

exports.createGraph = function(root) {

    var graph = new CORE.Graph(),
        rootMakefile = PATH.join(root, '.bem', 'makefile.js');

    return QFS.exists(rootMakefile)
        .then(function(exists) {
            if (exists) {
                var m = require(rootMakefile);
                if (m && m.graph) return graph.apply(m.graph);
            }

            return graph.apply(emptyGraph);
        });

};

function emptyGraph() {
    this.setNode({

        getId: function() {
            return 'all';
        },

        run: function() {
            return Q.reject(UTIL.format("** Nothing to be done for '%s'", this.getId()));
        }

    });

    return this;
}
