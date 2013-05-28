module.exports = function() {

    return this
            .title('bench').helpful()
            .arg()
                .name('treeish-list')
                .title('List of treeish to compare')
                .arr()
                .end()
            .opt()
                .name('benchmarks')
                .short('b').long('benchmark')
                .arr()
                .title('List of required benchmark entity')
                .end()
            .opt()
                .name('without-current-state')
                .short('w').long('wcs')
                .arr()
                .title('Run benchmarks without current state, only revision')
                .end()
            .act(function(opts,args) {
                return require('../bench')(opts, args).start();
            })
        .end();
};

