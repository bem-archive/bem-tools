var VM = require('vm'),
    Q = require('q'),
    QFS = require('q-fs'),
    INHERIT = require('inherit'),
    CORE = require('apw'),
    PATH = require('./path'),
    UTIL = require('util'),
    BEMUTIL = require('./util'),
    Node = require('./nodes/node'),
    registry = {};

exports.DEFAULT_WORKERS = 10;

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

    // TODO: move node introspection logic to the node in arch
    findNode: function(id, head, tail) {
        head = head || '';
        tail = tail || id;

        if (this.arch.hasNode(id)) return Q.ref(id);
        if (head == id) return Q.reject(UTIL.format('Node "%s" not found', id));

        var parts = tail.split(PATH.dirSep),
            p = parts.shift();
        head = (head? [head, p] : [p]).join(PATH.dirSep);
        tail = parts.join(PATH.dirSep);

        var _this = this,
            magicHead = head + '*';
        if (!this.arch.hasNode(magicHead)) {
            return this.findNode(id, head, tail);
        }

        return this.process(magicHead).then(function() {
            return _this.findNode(id, head, tail);
        });
    }

});

exports.createGraph = function(root) {

    var arch = new CORE.Arch(),
        defaultArch = require('./default-arch').Arch,
        rootMakefile = PATH.join(root, '.bem', 'make.js');

    return QFS.exists(rootMakefile)
        .then(function(exists) {
            if (exists){
                return BEMUTIL.readFile(rootMakefile).then(function(content){
                    var make = VM.runInNewContext(
                        content,
                        {
                            MAKE: Make,
                            console: console,
                            require: function(path){
                                if (path.match(/^\./)){
                                    path = PATH.resolve(PATH.dirname(rootMakefile), path);
                                }
                                return require(path);
                            }
                        },
                        rootMakefile);

                    return (new defaultArch(arch, root).alterArch());
                });
            } else {
                return (new defaultArch(arch, root).alterArch());
            }
        });

};

var Make = exports.Registry = {
    decl: function(nodeName, objectOrBaseName, object){

        var baseName = object? objectOrBaseName : nodeName,
            base = Make.getNodeClass(baseName);

        if (object && !base) throw new Error('Unknown base node ' + baseName);

        registry[nodeName] = INHERIT(base || Node, object || objectOrBaseName);

        return registry;
    },

    getRegistry: function(node) {
        return node? registry[node] : registry;
    },

    getNodeClass: function(nodeName){
        return Make.getRegistry(nodeName) || require('./nodes')[nodeName];
    }
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
