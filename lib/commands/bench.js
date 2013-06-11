module.exports = function() {

    return this
            .title('Benchmarks BEMHTML').helpful()
            .arg()
                .name('treeish-list')
                .title('List of treeish (revisions) to compare')
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
                .flag()
                .title('Run benchmarks without current state, only revision')
                .end()
            .opt()
                .name('only-bench')
                .short('ob').long('only-bench')
                .flag()
                .title('Run benchmarks on latest make')
                .end()
            .opt()
                .name('delta-rme')
                .short('dr').long('delta-rme')
                .title('Delta for RME')
                .end()
            .opt()
                .name('wait')
                .short('wait').long('wait')
                .title('Waiting for benchmarks preparing')
                .end()
            .act(function(opts,args) {
                return require('../bench')(opts, args).start();
            })
        .end();
};

