var Q = require('q'),
    INHERIT = require('inherit'),
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
                bundleNode = this.bundleNode = arch.setNode(new FileNode(this.path), arch.parents[thisNode]),
                _this = this;

            // generate targets for page files
            var techTargets = {};
            this.getTechDeps().map(function(tech) {
                var n = _this.createNode(ctx, tech);
                techTargets[tech] = arch.replaceNode(n);

                arch.link(n.getId(), bundleNode);
                arch.link(thisNode, n.getId());

                var expander = _this.createImportsExpanderNode(ctx, n, tech);
                if (expander) arch.setNode(expander, bundleNode, n.getId());
            });

            // link targets for page files with each other
            return this.linkNodes(ctx, techTargets);
        };

    },

    createNode: function(ctx, tech) {
        if (this['create-node-' + tech]) {
            return this['create-node-' + tech](ctx, tech);
        }
        return new FileNode(this.getPath(tech));
    },

    createImportsExpanderNode: function(ctx, importsNode, tech) {
        if (this['create-imports-expander-node-' + tech]) {
            return this['create-imports-expander-node-' + tech](ctx, importsNode);
        }
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


    getNodePrefix: function() {
        if (!this._nodeSuffix) {
            this._nodeSuffix = PATH.join(PATH.basename(this.level.dir), this.level.getRelByObj(this.item));
        }
        return this._nodeSuffix;
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
            ctx.arch.setNode(metaNode, buildNode.getId(), this.createNode(ctx, declTech).getId());
        }

        return buildNode;
    },

    'create-node-bemdecl.js': function(ctx, tech) {
        return new BemCreateNode(this.level, this.item, tech, tech);
    },

    'create-node-deps.js': function(ctx, tech) {
        return this.getBemBuildNode(ctx, tech, tech, 'bemdecl.js');
    },

    'create-node-html': function(ctx, tech) {
        // TODO: move node to bem-bl/blocks-common/i-bem/bem
        var techHtml = require.resolve(PATH.resolve(this.level.dir, '../bem-bl/blocks-common/i-bem/bem/techs/html'));
        return new BemCreateNode(this.level, this.item, techHtml, tech);
    },

    'create-node-bemhtml.js': function(ctx, tech) {
        // TODO: move node to bem-bl/blocks-common/i-bem/bem
        var techBemHtml = require.resolve(PATH.resolve(this.level.dir, '../bem-bl/blocks-common/i-bem/bem/techs/bemhtml.js'));
        return this.getBemBuildNode(ctx, tech, techBemHtml, 'deps.js', true);
    },

    'create-node-js': function(ctx, tech) {
        return this.getBemBuildNode(ctx, tech, tech, 'deps.js');
    },

    'create-node-css': function(ctx, tech) {
        return this.getBemBuildNode(ctx, tech, tech, 'deps.js');
    },

    'create-node-ie.css': function(ctx, tech) {
        return this.getBemBuildNode(ctx, tech, tech, 'deps.js');
    },

    'create-imports-expander-node-js': function(ctx, importsNode) {
        return new (registry.getNodeClass('BorschikNode'))(this.level, importsNode, 'js', true);
    },

    'create-imports-expander-node-css': function(ctx, importsNode) {
        return new (registry.getNodeClass('BorschikNode'))(this.level, importsNode, 'css', true);
    },

    'create-imports-expander-node-ie.css': function(ctx, importsNode) {
        return this['create-imports-expander-node-css'](ctx, importsNode);
    }
});

function createItem(bundleName, subBundleName) {
    var item = { block: bundleName };

    if (subBundleName) item.elem = subBundleName;

    return item;
}
