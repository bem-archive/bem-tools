'use strict';

var Q = require('q'),
    QFS = require('q-io/fs'),
    SERVER = require('../server').Server,
    PATH = require('path'),
    ENB = require('enb'),
    UTIL = require('../util'),
    LOGGER = require('../logger'),

    DEFAULT_WORKERS = require('../make').DEFAULT_WORKERS,
    DEFAULT_PORT = 8080,
    DEFAULT_SOCKET = '.bem/server.sock',
    DEFAULT_SOCKET_MODE = '0644';

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
            .val(function(val) {
                if (!isNaN(val)) return val;

                LOGGER.fatal('tcp port must be a number');
            })
            .end()
        .opt()
            .name('socket').long('socket')
            .title('listen on unix socket in addition to net socket')
            .flag()
            .end()
        .opt()
            .name('socketOnly').long('socket-only')
            .title('listen on unix socket (net socket will not be used)')
            .flag()
            .end()
        .opt()
            .name('socketPath').long('socket-path')
            .title('unix socket to listen on, default: [project root]/' + DEFAULT_SOCKET)
            .def(DEFAULT_SOCKET)
            .act(function(opts) {
                opts.socketPath = PATH.resolve(opts.root, opts.socketPath);
            })
            .end()
        .opt()
            .name('socketMode').long('socket-mode')
            .title('unix socket mode, default: ' + DEFAULT_SOCKET_MODE)
            .def(DEFAULT_SOCKET_MODE)
            .end()
        .opt()
            .name('force').title('Force rebuild on every request')
            .long('force')
            .flag()
            .end()
        .opt()
            .name('verbosity').short('v').long('verbosity')
            .title('Verbosity level (' + Object.keys(LOGGER.levels).join(', ') + '), default: info')
            .def('info')
            .end()
        .opt()
            .name('noColors').long('no-colors')
            .title('Disable colorful output')
            .flag()
            .end()
        .act(function(opts) {
            UTIL.setEnv(opts);
            LOGGER.configure({
                level: opts.verbosity,
                noColors: opts.noColors
            });

            LOGGER.finfo('bem ' + require('../../package.json').version);
            Object.keys(process.versions).forEach(function(key) {
                LOGGER.fdebug('%s %s', key, process.versions[key]);
            });

            var rootMakefile = PATH.join(opts.root, '.bem', 'make.js');

            return QFS.exists(rootMakefile)
                .then(function(exists) {
                    /* jshint -W109 */
                    LOGGER.fsilly("File '%s' %s", rootMakefile, exists? 'exists' : "doesn't exist");
                    /* jshint +W109 */
                    if (exists) {
                        LOGGER.warn('Native bem server is deprecated. Use ENB config instead.');
                        return (new SERVER(opts)).start();
                    }

                    LOGGER.finfo('Trying to use ENB');

                    var options = {
                        dir: opts.root,
                        mode: process.env.YENV === 'production' ? 'production' : 'development',
                        cache: !opts.force,
                        port: opts.port
                    };

                    opts.host && (options.host = opts.host);
                    opts.socket && (options.socket = opts.socketPath);

                    try {
                        return ENB.runServer(options);
                    } catch(err) {}
                });
        });

};
