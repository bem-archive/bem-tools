var Q = require('q'),
    PATH = require('path'),
    MAKE = require('../make'),

    DEFAULT_WORKERS = MAKE.DEFAULT_WORKERS;

module.exports = function() {

    return this
        .title('BEM make.')
        .helpful()
        .opt()
            .name('root').short('r').long('root')
            .title('project root (cwd by default)')
            .def(process.cwd())
            .val(function(d) {
                return PATH.resolve(d);
            })
            .end()
        .opt()
            .name('method').title('Method to run, default: make')
            .short('m').long('method')
            .def('make')
            .end()
        .opt()
            .name('workers').title('Run number of workers, default: ' + DEFAULT_WORKERS)
            .short('w').long('workers')
            .def(DEFAULT_WORKERS)
            .val(function(val) {
                return val > 0? val : DEFAULT_WORKERS;
            })
            .end()
        .opt()
            .name('force').title('Force rebuild')
            .long('force')
            .flag()
            .end()
        .opt()
            .name('verbose').short('v').long('verbose')
            .title('Verbose logging')
            .flag()
            .end()
        .arg()
            .name('targets').title('Build targets')
            .def('all')
            .arr()
            .end()
        .act(function(opts, args) {
            return Q.when(MAKE.createGraph(opts.root), function(graph) {
                return (new MAKE.Runner(graph, opts.workers, {
                        root: opts.root,
                        method: opts.method,
                        verbose: opts.verbose,
                        force: opts.force
                    }))
                    .findAndProcess(args.targets);
            });
        });

};
