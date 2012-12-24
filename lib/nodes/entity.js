var INHERIT = require('inherit'),
    PATH = require('../path'),
    U = require('../util'),
    createLevel = require('../index').createLevel,

    registry = require('../nodesregistry'),
    Node = require('./node').NodeName,

    EntityNodeName = exports.EntityNodeName = 'EntityNode';

exports.__defineGetter__(EntityNodeName, function() {
    return registry.getNodeClass(EntityNodeName);
});

registry.decl(EntityNodeName, Node, {

    __constructor: function(o) {
        this.level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level)) :
            o.level;
        this.item = o.item || o;
        this.resolved = this.__self.resolve(o);
        this.root = o.root;

        this.rootLevel = createLevel(o.root);

        this.__base(U.extend({}, o, {
            resolved: this.resolved,
            level: this.level
        }));
    },

    getPath: function() {
        return this.rootLevel.resolveBemPath(this.resolved);
    }

}, {

    createId: function(o) {
        return U.serializeBemPath(o.resolved || this.resolve(o));
    },

    resolve: function(o) {
        var level = typeof o.level === 'string'?
                createLevel(PATH.resolve(o.root, o.level)) :
                o.level,
            rootLevel = createLevel(o.root);

         var resolved = rootLevel
                .matchPath(level.dir);

        if (!resolved) throw new Error('Path ' + level.dir + ' can\'t be resolved as a level.');

        resolved.push(o.item || o);

        return resolved;
    }
});

