var VM = require('vm'),
    Q = require('q'),
    QFS = require('q-fs'),
    INHERIT = require('inherit'),
    APW = require('apw'),
    PATH = require('./path'),
    UTIL = require('util'),
    BEMUTIL = require('./util'),
    LOGGER = require('./logger'),
    registry = {};

exports.DEFAULT_WORKERS = 10;

exports.APW = INHERIT(APW, {

    findAndProcess: function(targets) {
        if (!Array.isArray(targets)) targets = [targets];
        var _this = this,
            foundNodes = targets.map(function(t) {
                return _this.findNode(t);
            });
        return Q.all(foundNodes)
            .fail(function(err) {
                if (typeof err === 'string') return;
                return Q.reject(err);
            })
            .then(function() {
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

}, {

    Workers: INHERIT(APW.Workers, {

        start: function(plan) {
            LOGGER.finfo("[i] Going to build '%s' [%s]", plan.getTargets().join("', '"), plan.getId());
            return this.__base(plan);
        }

    })

});

exports.createArch = function(root) {

    var arch = new APW.Arch(),
        rootMakefile = PATH.join(root, '.bem', 'make.js');

    // Register default arch in the registry to be available for Make.decl()
    Make.decl('Arch', require('./default-arch').Arch);

    return QFS.exists(rootMakefile)
        .then(function(exists) {

            LOGGER.fsilly("File '%s' %s", rootMakefile, exists? 'exists' : "doesn't exist");

            if (!exists) return;

            return BEMUTIL.readFile(rootMakefile).then(function(content) {

                LOGGER.fsilly("File '%s' read, evaling", rootMakefile);

                VM.runInNewContext(
                    content,
                    BEMUTIL.extend({}, global, {
                        MAKE: Make,
                        module: null,
                        require: function(path) {
                            if (path.match(/^\./)){
                                path = PATH.resolve(PATH.dirname(rootMakefile), path);
                            }
                            return require(path);
                        }
                    }),
                    rootMakefile);

                LOGGER.fsilly("File '%s' evaled", rootMakefile);

            });
        })
        .then(function() {
            return new (Make.getRegistry('Arch'))(arch, root).alterArch();
        });

};

var Make = exports.NodesRegistry = {

    decl: function(nodeName, objectOrBaseName, object) {

        var baseName = object? objectOrBaseName : nodeName,
            base = Make.getNodeClass(baseName);

        if (object && !base) throw new Error('Unknown base node ' + baseName);

        object = object || objectOrBaseName;

        registry[nodeName] = typeof object === 'function'? object: INHERIT(base || require('./nodes/node').Node, object);

        return registry;
    },

    getRegistry: function(node) {
        return node? registry[node] : registry;
    },

    getNodeClass: function(nodeName){
        return Make.getRegistry(nodeName) || require('./nodes')[nodeName];
    }

};
