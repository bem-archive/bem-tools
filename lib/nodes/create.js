var INHERIT = require('inherit'),
    Q = require('q'),
    QFS = require('q-fs'),
    PATH = require('../path'),
    BEM = require('../coa').api,
    createLevel = require('../level').createLevel,
    LOGGER = require('../logger'),
    U = require('../util'),
    registry = require('../nodesregistry'),

    GeneratedFileNode = require('./file').GeneratedFileNodeName,

    BemCreateNodeName = exports.BemCreateNodeName = 'BemCreateNode';

exports.__defineGetter__(BemCreateNodeName, function() {
    return registry.getNodeClass(BemCreateNodeName);
});

registry.decl(BemCreateNodeName, GeneratedFileNode, {

    nodeType: 5,

    __constructor: function(o) {

        this.level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level)) :
            o.level;
        this.item = o.item;
        this.tech = this.level.getTech(o.techName, o.techPath);
        this.force = !!o.force || false;

        this.__base(U.extend({ path: this.__self.createPath(o) }, o));

    },

    make: function() {

        var opts = U.extend({}, {
            force: this.force,
            level: this.level.dir,
            forceTech: this.tech.getTechPath()
        });

        ['block', 'elem', 'mod', 'val'].forEach(function(key) {
            if (this.item[key]) opts[key] = this.item[key];
        }, this);

        this.log('bem.create(%s, {})', JSON.stringify(opts, null, 4));

        return BEM.create(opts, {});
    },

    getNodePrefix: function(o) {

        if (!this._nodePrefix) {
            this._nodePrefix = this.__self.createNodePrefix(o || {
                root: this.root,
                level: this.level,
                item: this.item
            });
        }
        return this._nodePrefix;

    },

    /**
     * clean() implementation.
     * @return {Promise * Undefined}
     */
    clean: function() {

        var _this = this;
        return Q.all(this.tech
            .getPaths(PATH.resolve(this.root, this.getNodePrefix()), this.tech.getCreateSuffixes())
            .map(function(path) {

                return QFS.remove(path)
                    .then(function() {
                        LOGGER.fverbose('[-] Removed %j', path);
                    })
                    .fail(function() {});

            }))
            .then(function() {

                return U.removePath(_this.getPath())
                    .then(function() {
                        LOGGER.fverbose('[-] Removed %j', _this.getId());
                    })
                    .fail(function() {});

            });

    },

    getFiles: function() {
        return this.tech.getPaths(this.getNodePrefix(), this.tech.getCreateSuffixes());
    },

    getDependencies: function() {

        return this.tech.getDependencies().map(function(d) {
            return this.level.getPath(this.getNodePrefix(), d);
        }, this);

    }

}, {

    createId: function(o) {
        return this.createPath(o);
    },

    createPath: function(o) {

        var level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level)) :
            o.level;

        return level
            .getTech(o.techName, o.techPath)
            .getPath(this.createNodePrefix(U.extend({}, o, { level: level })));

    },

    createNodePrefix: function(o) {

        var level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level)) :
            o.level;

        return PATH.relative(o.root, level.getByObj(o.item));

    }

});
