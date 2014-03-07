'use strict';

var Q = require('q'),
    PATH = require('path'),
    MAKE = require('../make'),
    UTIL = require('../util'),
    LOGGER = require('../logger'),
    InspectorServer = require('../inspector-server').Server,

    DEFAULT_INSPECTOR_PORT = 8081,
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
            .name('inspector').title('Enable inspector server')
            .long('inspector')
            .short('i')
            .flag()
            .end()
        .opt()
            .name('inspector-port').long('inspector-port')
            .title('inspector server tcp port to listen on, default: ' + DEFAULT_INSPECTOR_PORT)
            .def(DEFAULT_INSPECTOR_PORT)
            .val(function(val) {
                if (!isNaN(val)) return val;

                LOGGER.fatal('tcp port must be a number');
            })
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
            .name('verbosity').short('v').long('verbosity')
            .title('Verbosity level (' + Object.keys(LOGGER.levels).join(', ') + '), default: info. Can be set via BEM_MAKE_VERBOSITY env variable.')
            .def(process.env.BEM_MAKE_VERBOSITY || 'info')
            .end()
        .opt()
            .name('noColors').long('no-colors')
            .title('Disable colorful output. Can be set via BEM_MAKE_NO_COLORS env variable: 1/true/TRUE/yes/YES => true, everything else => false')
            .flag()
            .def(/1|true|yes/i.test(process.env.BEM_MAKE_NO_COLORS))
            .end()
        .arg()
            .name('targets').title('Build targets')
            .def('all')
            .arr()
            .end()
        .act(function(opts, args) {
            UTIL.setEnv(opts);
            LOGGER.configure({
                level: opts.verbosity,
                noColors: opts.noColors
            });

            LOGGER.finfo('bem ' + require('../../package.json').version);
            Object.keys(process.versions).forEach(function(key) {
                LOGGER.fdebug('%s %s', key, process.versions[key]);
            });

            LOGGER.time('[t] Build total');
            return Q.when(MAKE.createArch(opts), function(arch) {
                var build = (new MAKE.APW(arch, opts.workers, opts))
                        .findAndProcess(args.targets)
                        .fin(function() {
                            LOGGER.timeEnd('[t] Build total');
                        }),

                    server = opts.inspector && (new InspectorServer(opts)).start(opts);

                if (server) {
                    server.then(function() {
                        process.kill(process.pid, 'SIGINT');
                    });
                }

                return build;
            });
        });

};
