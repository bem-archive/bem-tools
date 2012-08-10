var PATH = require('path');

// Build i18n files
MAKE.decl('BundleNode', {

    getTechs: function() {

        var arr = this.__base();

        // remove js tech
        arr.splice(arr.indexOf('js'), 1);

        // add i18n techs
        return arr.concat(['i18n', 'i18n.js']);

    },

    'create-i18n.js-optimizer-node': function(tech, sourceNode, bundleNode) {

        sourceNode.getFiles().forEach(function(f) {
            this['create-js-optimizer-node'](tech, this.ctx.arch.getNode(f), bundleNode);
        }, this);

    }

});


// Build merged bundle
MAKE.decl('BundleNode', {

    getTechs: function() {

        if (this.getLevelPath() === 'pages-with-merged') return [
            'bemdecl.js',
            'deps.js'
        ];

        return this.__base();

    }

});


MAKE.decl('BundlesLevelNode', {

    buildMergedBundle: function() {
        return this.getLevelPath() === 'pages-with-merged';
    }

});
