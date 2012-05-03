var Q = require('q'),
    INHERIT = require('inherit'),
    UTIL = require('../util'),
    PATH = require('path'),
    createLevel = require('../index').createLevel,

    MagicNode = require('./magic').MagicNode,
    FileNode = require('./file').FileNode,
    BemCreateNode = require('./create').BemCreateNode,
    BemBuildNode = require('./build').BemBuildNode,
    BemBuildMetaNode = require('./build').BemBuildMetaNode,
    registry = require('../make').Registry;

var BundleNode = exports.BundleNode = INHERIT(MagicNode, {

    __constructor: function(level, bundleNameOrItem, subBundleName) {
        this.level = typeof level == 'string'? createLevel(level) : level;

        this.item = (typeof bundleNameOrItem === 'string')? createItem(bundleNameOrItem, subBundleName) : bundleNameOrItem;

        this.__base(PATH.dirname(this.getNodePrefix()));
    },

    make: function(ctx) {

        return ctx.arch.withLock(this.alterArch(ctx), this);

    },

    alterArch: function(ctx) {

        return function() {

            // create real node for page
            var arch = ctx.arch,
                thisNode = this.getId(),
                bundleNode = arch.hasNode(this.path)?
                    arch.getNode(this.path).getId() :
                    arch.setNode(new FileNode(this.path), arch.parents[thisNode]),
                _this = this;

            // generate targets for page files
            var techTargets = {};
            this.getTechDeps().map(function(tech) {
                console.log('thisNode %s bundleNode %s', thisNode, bundleNode);
                var n = techTargets[tech] = _this.createNode(ctx, tech, bundleNode, thisNode);

                _this.createOptimizerNode(ctx, bundleNode, n, tech);
            });

            // link targets for page files with each other
            return this.linkNodes(ctx, techTargets);
        };

    },

    lastModified: function() {
        var d = Q.defer();
        d.resolve(0);
        return d.promise;
    },

    createNode: function(ctx, tech, bundleNode, magicNode) {
        var node,
            arch = ctx.arch;

        if (this['create-' + tech + '-node']) node = this['create-' + tech + '-node'](ctx, tech)
        else node = this.createDefaultNode(ctx, tech);

        node = arch.replaceNode(node);

        bundleNode && arch.link(node, bundleNode);
        magicNode && arch.link(magicNode, node);

        return node;
    },

    createOptimizerNode: function(ctx, bundleNode, sourceNode, tech) {
        var node,
            arch = ctx.arch;

        if (this['create-' + tech + '-optimizer-node']) node = this['create-' + tech + '-optimizer-node'](ctx, sourceNode)
        else node = this.createDefaultOptimizerNode(ctx, sourceNode, tech);

        if (node) {
            node = arch.replaceNode(node);
            arch.link(sourceNode, node);
            arch.link(node, bundleNode);
        }

        return node;
    },

    linkNodes: function(ctx, techTargets) {
        return Q.all(Object.keys(techTargets).map(function(target) {
            var targetNode = ctx.arch.nodes[techTargets[target]];
            if (targetNode.getCreateDependencies)
                return Q.when(targetNode.getCreateDependencies(ctx), function(deps) {
                    for(var d = 0; d < deps.length; d++) ctx.arch.link(
                        deps[d],
                        techTargets[target]);
                });
        }));
    },

    getPath: function(tech) {
        // TODO: use Tech object to construct paths
        return this.getNodePrefix() + '.' + tech;
    },

    getTechDeps: function() {
        return [
            'bemjson.js',
            'bemdecl.js',
            'deps.js',
            'html',
            'bemhtml.js',
            'css',
            'ie.css',
            'js'
        ];
    },

    cleanup: function(ctx) {
        var arch = ctx.arch;
        if (!arch.hasNode(this.path)) return;
        arch.removeTree(this.path);
    },

    getNodePrefix: function(ctx) {
        if (!this._nodePrefix) {
            this._nodePrefix = this.__self._createId(this.level, this.item);
        }
        return this._nodePrefix;
    },

    getLevels: function(prefix) {
        return [].concat(
            this.level.getConfig().bundleBuildLevels,
            [ PATH.join(PATH.dirname(prefix), 'blocks') ]);
    },

    getBemBuildNode: function(ctx, techName, techPath, declTech, forked) {
        var buildNode = new BemBuildNode(this.getLevels(this.getNodePrefix()), this.getPath(declTech), techPath, techName, this.getNodePrefix(), forked);

        // FIXME: rethink of this.createNode(ctx, declTech).getId() !!!
        var metaNode = buildNode.getMetaNode();
        if (!ctx.arch.hasNode(metaNode.getId())) {
            ctx.arch.setNode(metaNode, buildNode.getId(), this.createNode(ctx, declTech));
        }

        return buildNode;
    },

    createDefaultNode: function(ctx, tech) {
        return new FileNode(this.getPath(tech));
    },

    'create-bemdecl.js-node': function(ctx, tech) {
        return new BemCreateNode(this.level, this.item, tech, tech);
    },

    'create-deps.js-node': function(ctx, tech) {
        return this.getBemBuildNode(ctx, tech, tech, 'bemdecl.js');
    },

    'create-html-node': function(ctx, tech) {
        // TODO: move node to bem-bl/blocks-common/i-bem/bem
        var techHtml = require.resolve(PATH.resolve(this.level.dir, '../bem-bl/blocks-common/i-bem/bem/techs/html'));
        return new BemCreateNode(this.level, this.item, techHtml, tech);
    },

    'create-bemhtml.js-node': function(ctx, tech) {
        // TODO: move node to bem-bl/blocks-common/i-bem/bem
        var techBemHtml = require.resolve(PATH.resolve(this.level.dir, '../bem-bl/blocks-common/i-bem/bem/techs/bemhtml.js'));
        return this.getBemBuildNode(ctx, tech, techBemHtml, 'deps.js', true);
    },

    'create-js-node': function(ctx, tech) {
        return this.getBemBuildNode(ctx, tech, tech, 'deps.js');
    },

    'create-css-node': function(ctx, tech) {
        return this.getBemBuildNode(ctx, tech, tech, 'deps.js');
    },

    'create-ie.css-node': function(ctx, tech) {
        return this.getBemBuildNode(ctx, tech, tech, 'deps.js');
    },

    createDefaultOptimizerNode: function(ctx, sourceNode, tech) {

    },

    'create-js-optimizer-node': function(ctx, sourceNode) {
        return new (registry.getNodeClass('BorschikNode'))(sourceNode, 'js', true);
    },

    'create-css-optimizer-node': function(ctx, sourceNode) {
        return new (registry.getNodeClass('BorschikNode'))(sourceNode, 'css-fast', true);
    },

    'create-ie.css-optimizer-node': function(ctx, sourceNode) {
        return this['create-css-optimizer-node'](ctx, sourceNode);
    }
},
{
    createId: function(level, bundleNameOrItem, subBundleName) {
        return this.__base(PATH.dirname(this._createId(level, bundleNameOrItem, subBundleName)));
    },

    _createId:  function(level, bundleNameOrItem, subBundleName) {
        return UTIL.getNodePrefix(
                    (typeof level == 'string')? createLevel(level) : level,
                    (typeof bundleNameOrItem === 'string')? createItem(bundleNameOrItem, subBundleName) : bundleNameOrItem);
    }
});

function createItem(bundleName, subBundleName) {
    var item = { block: bundleName };

    if (subBundleName) item.elem = subBundleName;

    return item;
}
