MAKE.decl('Arch', {
	libraries: {}
});

MAKE.decl('BundlesLevelNode', {
    buildMergedBundle: function() {
        return true;
    }
});
