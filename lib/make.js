var Q = require('q'),
    QFS = require('q-fs'),
    INHERIT = require('inherit'),
    CORE = require('samurai'),
    PATH = require('./path'),
    UTIL = require('util');

exports.DEFAULT_JOBS = 10;

exports.Runner = INHERIT(CORE.Runner, {

    findAndProcess: function(targets) {
        if (!Array.isArray(targets)) targets = [targets];
        var _this = this,
            foundNodes = targets.map(function(t) {
                return _this.findNode(t);
            });
        return Q.all(foundNodes).fin(function(t) {
            return _this.process(targets);
        });
    },

    // TODO: move node introspection logic to the node in graph
    findNode: function(id, head, tail) {
        head = head || '';
        tail = tail || id;

        if (this.graph.hasNode(id)) return Q.ref(id);
        if (head == id) return Q.reject('Node %s not found', id);

        var parts = tail.split(PATH.dirSep),
            p = parts.shift();
        head = (head? [head, p] : [p]).join(PATH.dirSep);
        tail = parts.join(PATH.dirSep);

        var _this = this,
            magicHead = head + '*';
        if (!this.graph.hasNode(magicHead)) {
            return this.findNode(id, head, tail);
        }

        return this.process(magicHead).then(function() {
            return _this.findNode(id, head, tail);
        });
    }

});

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
