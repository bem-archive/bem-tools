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
        return Q.all(foundNodes).then(function(t) {
            //console.log('*** foundNodes: %j', t);
            return _this.process(targets);
        });
    },

    findNode: function(id, stack, rev) {
        stack = stack || [];
        rev = rev || false;
        //console.log('*** findNode(%j, %j, %j): ', id, stack, rev, this.graph.hasNode(id));
        if (this.graph.hasNode(id)) return Q.ref(id);

        var _this = this,
            magicId = id + '*';
        if (!this.graph.hasNode(magicId)) {

            var newId;
            if (!rev) {
                var parts = id.split(PATH.dirSep);
                parts.pop();
                newId = parts.join(PATH.dirSep);
                stack.push(id);
            } else {
                newId = stack.pop();
            }

            if (!newId) return false;

            return Q.when(this.findNode(newId, [].concat(stack), rev), function(gotId) {
                if (gotId || gotId === false) return gotId;
                return _this.findNode(id, [].concat(stack), rev);
            });
        }

        return this.process(magicId).then(function() {
            return _this.findNode(stack.pop(), [].concat(stack), true);
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
