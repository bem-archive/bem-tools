var Q = require('q'),
    QFS = require('q-fs'),
    INHERIT = require('inherit'),
    PATH = require('path'),
    U = require('../util'),
    LOGGER = require('../logger'),

    createLevel = require('../index').createLevel,

    registry = require('../nodesregistry'),
    Node = require('./node').NodeName,
    FileNode = require('./file').FileNode,

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

    getPaths: function() {
        return this.rootLevel.resolveBemPath(this.resolved);
    },

    getRelPaths: function() {
        return this.rootLevel.resolveBemRelPath(this.resolved);
    },

    getNodePrefix: function() {

        if (!this._nodePrefix) {
            this._nodePrefix = this.__self.createNodePrefix({
                root: this.root,
                level: this.level,
                item: this.item
            });
        }

        return this._nodePrefix;

    },

    /**
     * Get files minimum mtime in milliseconds or -1 in case of any file doesn't exist.
     *
     * @return {Promise * Number}
     */
    lastModified: function() {
        var _this = this;
        return Q.all(this.getPaths()
            .map(function(path) {

                return QFS.lastModified(path)
                    .then(function(lm) {
                        LOGGER.fdebug('lastModified %s (%s) = %s', _this.getId(), path, lm);
                        return lm;
                    })
                    .fail(function() {
                        LOGGER.fdebug('lastModified %s (%s) = %s', _this.getId(), path, -1);
                        return -1;
                    })

            }))
            .spread(Math.min);
    },

    /**
     * isValid() implementation.
     *
     * @return {Promise * Boolean}  Node validity state (true if node is valid).
     */
    isValid: function() {

        if (this.ctx.method && this.ctx.method != 'make') return Q.resolve(false);
        if (this.ctx.force) return Q.resolve(false);

        var arch = this.ctx.arch,
            parent = this.lastModified(),
            children = arch.getChildren(this)
                .filter(function(child) {
                    return (child && (arch.getNode(child)));
                })
                .map(function(child) {
                    return arch.getNode(child).lastModified();
                }),
            _this = this;

        // with no deps we must always check for file existence
        // isValid() == false will guarantee it
        if (!children.length) {
            return parent.then(
                function(min) {
                    LOGGER.fdebug('*** isValid(%s): no deps => file existence %s minxxx %s', _this.getId(), min > -1, min);
                    return min > -1;
                })
        }

        return Q.all(children).then(function(all) {
            var max = Math.max.apply(Math, all);

            return parent.then(function(cur) {
                LOGGER.fdebug('*** isValid(%s): cur=%s, max=%s, valid=%s', _this.getId(), cur, max, cur >= max && max > -1);
                return Q.resolve(cur >= max && max > -1);
            })
        });

    }

}, {

    createNodePrefix: function(o) {

        var level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level)) :
            o.level;

        return PATH.relative(o.root, level.getByObj(o.item));

    },

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

