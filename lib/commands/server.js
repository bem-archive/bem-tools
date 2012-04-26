var SERVER = require('../server'),
    PATH = require('path'),
    UTIL = require('../util'),

    DEFAULT_WORKERS = require('../make').DEFAULT_WORKERS,
    DEFAULT_PORT = 8080;

module.exports = function() {

    return this
        .title('Development server.')
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
            .name('workers').title('Run number of workers, default: ' + DEFAULT_WORKERS)
            .short('w').long('workers')
            .def(DEFAULT_WORKERS)
            .val(function(val) {
                return val > 0? val : DEFAULT_WORKERS;
            })
            .end()
        .opt()
            .name('host').long('host')
            .title('hostname to listen on, default: any')
            .end()
        .opt()
            .name('port').short('p').long('port')
            .title('tcp port to listen on, default: ' + DEFAULT_PORT)
            .def(DEFAULT_PORT)
            .end()
        .opt()
            .name('force').title('Force rebuild on every request')
            .long('force')
            .flag()
            .end()
        .opt()
            .name('verbose').short('v').long('verbose')
            .title('Verbose logging')
            .flag()
            .end()
        .act(function(opts, args) {
            UTIL.setEnv(opts);
            return SERVER.start(opts);
        });

};
