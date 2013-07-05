'use strict';

module.exports = function() {

    return this
            .title('Benchmarks')
            .helpful()
            .arg()
                .name('treeish-list')
                .title('List of revisions to compare (git treeish)')
                .arr()
                .end()
            .opt()
                .name('benchmarks')
                .short('b').long('benchmark')
                .arr()
                .title('List of benchmarks to run')
                .end()
            .opt()
                .name('no-wc')
                .short('w').long('no-wc')
                .flag()
                .title('Run benchmarks without using working copy, use only specified revisions')
                .end()
            .opt()
                .name('rerun')
                .long('rerun')
                .flag()
                .title('Reuse previously checked out and made revisions, run benchmarks only')
                .end()
            .opt()
                .name('rme')
                .short('r').long('rme')
                .title('Delta for RME')
                .end()
            .opt()
                .name('delay')
                .short('d').long('delay')
                .title('Delay between benchmarks')
                .end()
            .act(function(opts,args) {
                return require('../bench')(opts, args).start();
            })
        .end();
};
