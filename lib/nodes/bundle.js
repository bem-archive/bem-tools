var INHERIT = require('inherit'),
    PATH = require('path'),
    createLevel = require('../index').createLevel,

    MagicNode = require('./magic').MagicNode,
    FileNode = require('./file').FileNode,
    BemCreateNode = require('./create').BemCreateNode,
    BemBuildNode = require('./build').BemBuildNode,
    BemBuildForkedNode = require('./build').BemBuildForkedNode;

exports.BundleNode = INHERIT(MagicNode, {

    __constructor: function(level, bundleName, subBundleName) {
        this.level = typeof level == 'string'? createLevel(level) : level;
        this.item = { block: bundleName };

        if (subBundleName) this.item.elem = subBundleName;

        this.__base(PATH.dirname(this.getNodePrefix()));
    },

    make: function(ctx) {
        if (ctx.arch.hasNode(this.path)) return;

        ctx.arch.withLock(function() {

            // create real node for page
            var parents = ctx.arch.parents[this.getId()],
                pageNode = ctx.arch.setNode(new FileNode(this.path), parents);

            // generate targets for page files
            for (var tech in this.getTechDeps()) {
                ctx.arch.setNode(this.createNode(ctx, tech), pageNode);
            }

            // link targets for page files with each other
            this.linkNodes(ctx);

        }, this);
    },

    createNode: function(ctx, tech) {
        if (this['create-node-' + tech]) {
            return this['create-node-' + tech](ctx, tech);
        }
        return new FileNode(this.getPath(tech));
    },

    linkNodes: function(ctx) {
        var deps = this.getTechDeps();
        for (var tech in deps) {
            for (var i = 0, l = deps[tech].length; i < l; i++) {
                ctx.arch.link(this.getPath(deps[tech][i]), this.getPath(tech));
            }
        }
    },

    getPath: function(tech) {
        // TODO: use Tech object to construct paths
        return this.getNodePrefix() + '.' + tech;
    },

    getTechDeps: function() {
        return {
            'bemjson.js': [],
            'bemdecl.js': ['bemjson.js'],
            'deps.js': ['bemdecl.js'],
            'html': ['bemjson.js', 'bemhtml.js'],
            'bemhtml.js': ['deps.js'],
            'css': ['deps.js'],
            'ie.css': ['deps.js'],
            'js': ['deps.js']
        };
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

    getBemBuildNode: function(techName, techPath, declTech) {
        return new BemBuildNode(this.getLevels(this.getNodePrefix()), this.getPath(declTech), techPath, techName, this.getNodePrefix());
    },

    getBemBuildForkedNode: function(techName, techPath, declTech) {
        return new BemBuildForkedNode(this.getLevels(), this.getPath(declTech), techPath, techName, this.getNodePrefix());
    },

    'create-node-bemdecl.js': function(ctx, tech) {
        return new BemCreateNode(this.level, this.item, tech, tech);
    },

    'create-node-deps.js': function(ctx, tech) {
        return this.getBemBuildNode(tech, tech, 'bemdecl.js');
    },

    'create-node-html': function(ctx, tech) {
        // TODO: move node to bem-bl/blocks-common/i-bem/bem
        var techHtml = require.resolve(PATH.resolve(this.level.dir, '../bem-bl/blocks-common/i-bem/bem/techs/html'));
        return new BemCreateNode(this.level, this.item, techHtml, tech);
    },

    'create-node-bemhtml.js': function(ctx, tech) {
        // TODO: move node to bem-bl/blocks-common/i-bem/bem
        var techBemHtml = require.resolve(PATH.resolve(this.level.dir, '../bem-bl/blocks-common/i-bem/bem/techs/bemhtml.js'));
        return this.getBemBuildForkedNode(tech, techBemHtml, 'deps.js');
    },

    'create-node-js': function(ctx, tech) {
        return this.getBemBuildNode(tech, tech, 'deps.js');
    },

    'create-node-css': function(ctx, tech) {
        return this.getBemBuildNode(tech, tech, 'deps.js');
    },

    'create-node-ie.css': function(ctx, tech) {
        return this.getBemBuildNode(tech, tech, 'deps.js');
    }

});
