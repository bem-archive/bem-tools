var Q = require('q'),
    CORE = require('samurai'),
    PATH = require('path'),
    MAKE = require('../make'),

    DEFAULT_JOBS = MAKE.DEFAULT_JOBS;

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
            .name('jobs').title('Run concurrent number of jobs, default: ' + DEFAULT_JOBS)
            .short('j').long('jobs')
            .def(DEFAULT_JOBS)
            .val(function(val) {
                return val > 0? val : DEFAULT_JOBS;
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
                return (new MAKE.Runner(graph, opts.jobs, {
                        method: opts.method,
                        verbose: opts.verbose,
                        force: opts.force
                    }))
                    .findAndProcess(args.targets);
            });
        });

};
