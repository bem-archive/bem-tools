var Q = require('q'),
    PATH = require('path'),
    MAKE = require('../make'),
    UTIL = require('../util'),
    LOGGER = require('../logger'),

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
            .title('Verbose logging (' + Object.keys(LOGGER.levels).join(', ') + ')')
            .end()
        .arg()
            .name('targets').title('Build targets')
            .def('all')
            .arr()
            .end()
        .act(function(opts, args) {
            UTIL.setEnv(opts);
            opts.verbose && LOGGER.setLevel(opts.verbose);

            return Q.when(MAKE.createArch(opts.root), function(arch) {
                return (new MAKE.APW(arch, opts.workers, opts))
                    .findAndProcess(args.targets);
            });
        });

};
