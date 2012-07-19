var PATH = require('path');

MAKE.decl('Arch', {
	libraries: {}
});


MAKE.decl('BundleNode', {

    getTechs: function() {
        if (PATH.basename(this.level.dir) === 'pages-with-merged') return [
            'bemdecl.js',
            'deps.js',
        ];
 
        return this.__base();
    }

});


MAKE.decl('BundlesLevelNode', {
    buildMergedBundle: function() {
        if (PATH.relative(this.root, this.getPath()) === 'pages-with-merged') return true;

        return false;
    }
});
