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

        console.log('resolved %j', this.resolved);
        this.rootLevel = createLevel(o.root);
        //console.log('path %s', rootLevel.resolveBemRelPath(this.resolved));
        //this.path = rootLevel.resolveBemRelPath(this.resolved);

        this.__base(U.extend({}, o, {
            resolved: this.resolved,
            level: this.level
        }));
    },

    getPath: function() {
        console.log('resolving %j to', this.resolved);
        var p = this.rootLevel.resolveBemPath(this.resolved);
        console.log('%s', p)
        return p;
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

         console.log('rootLevel=%s\nlevel=%s', rootLevel.dir, level.dir);

         var resolved = rootLevel
                .matchPath(level.dir);

        if (!resolved) throw new Error('Path ' + level.dir + ' can\'t be resolved as a level.');

        var item = o.item || o;
        if (item.tech !== 'bundles' && item.tech !== 'blocks') resolved.push(item);

        return resolved;
    }
});

