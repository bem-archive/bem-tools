'use strict';

var INHERIT = require('inherit'),
    Q = require('q'),
    QFS = require('q-io/fs'),
    QHTTP = require('q-io/http'),
    QS = require('querystring'),
    UTIL = require('util'),
    URL = require('url'),
    MIME = require('mime'),
    PATH = require('./path'),
    MAKE = require('./make'),
    LOGGER = require('./logger'),
    LEVEL = require('./level'),
    U = require('./util');

var defaultDocument = 'index.html';

exports.Server = INHERIT({

    __constructor: function(opts) {
        this.opts = opts || {};
    },

    start: function() {

        return this.rootExists(this.opts.root)()
            .then(this.showInfo())
            .then(this.initBuildRunner())
            .then(this.startServers())
            .then(function(servers) {
                return Q.all(servers.map(function(s) {
                    return s.stopped;
                }));
            })
            .then(function() {
                LOGGER.info('Servers were stopped');
            });

    },

    /* jshint -W109 */
    showInfo: function() {
        var _this = this;

        return function() {
            LOGGER.finfo("Project root is '%s'", _this.opts.root);
            LOGGER.fverbose('Options are %j', _this.opts);
        };
    },
    /* jshint +W109 */

    /* jshint -W109 */
    rootExists: function(root) {

        return function() {
            return QFS.exists(root).then(function(exists) {
                if (!exists) return Q.reject(UTIL.format("Project root '%s' doesn't exist", root));
            });
        };

    },
    /* jshint +W109 */

    startServers: function() {
        var _this = this;

        return function(runner) {
            var requestHandler = _this.createRequestHandler(_this.opts.root, runner);

            return Q.when(_this.startServer.call(_this, requestHandler),
                function(servers) {

                    return Q.all(servers).then(function(servers) {

                        // Stop all servers on Control + C
                        servers.forEach(function(server) {
                            process.once('SIGINT', _this.stopServer(server));
                        });

                        return servers;
                    });

                });

        };

    },

    startServer: function(requestHandler) {
        var _this = this,
            netServer = QHTTP.Server(requestHandler),
            started = [];

            netServer.node.on('error', this.errorHandler.bind(this));

            // Start server on net socket
            started.push(netServer.listen(_this.opts.port, _this.opts.host).then(function(listener) {
                LOGGER.finfo(
                    'Server is listening on port %s. Point your browser to http://%s:%s/',
                    _this.opts.port,
                    _this.opts.host || 'localhost',
                    _this.opts.port
                );

                return listener;
            }));

        return started;
    },

    stopServer: function(server) {
        return function() {
            server.stop();
        };
    },

    errorHandler: function(port, error) {
        if (!error) {
            error = port;
            port = this.opts.port;
        }

        switch (error.code) {
            case 'EADDRINUSE':
                LOGGER.error('port ' + port + ' is in use. Specify a different port or stop the service which is using it.');
                break;

            case 'EACCES':
                LOGGER.error('insufficient permissions to listen port ' + port + '. Specify a different port.');
                break;

            default:
                LOGGER.error(error.message);
                break;
        }
    },

    initBuildRunner: function() {
        var _this = this;

        return function() {
            return Q.when(MAKE.createArch(_this.opts), function(arch) {
                return new MAKE.APW(arch, _this.opts.workers, {
                    root: _this.opts.root,
                    verbose: _this.opts.verbose,
                    force: _this.opts.force
                });
            });
        };
    },

    _targetsInProcess: 0,

    createRequestHandler: function(root, runner) {
        var _this = this;

        return function(request, response) {

            var reqPath = URL.parse(request.path).pathname,
                relPath = QS.unescape(reqPath).replace(/^\/|\/$/g, ''),
                fullPath = PATH.join(root, relPath);

            if (PATH.dirSep === '\\') relPath = PATH.unixToOs(relPath);

            LOGGER.fverbose('*** trying to access %s', fullPath);

            // try to find node in arch
            LOGGER.fverbose('*** searching for node "%s"', relPath);
            return runner.findNode(relPath)
                .fail(function(err) {
                    if (typeof err === 'string') {
                        LOGGER.fverbose('*** node not found "%s"', relPath);
                        return;
                    }
                    return Q.reject(err);
                })
                .then(function(id) {
                    if (!id) return;

                    _this._targetsInProcess++;

                    // found, run build
                    LOGGER.fverbose('*** node found, building "%s"', id);
                    LOGGER.fdebug('targets: %s', _this._targetsInProcess);
                    LOGGER.time('[t] Build total for "%s"', id);
                    return runner.process(id).fin(function() {
                        _this._targetsInProcess--;

                        if (_this._targetsInProcess === 0) LEVEL.resetLevelsCache();
                        
                        LOGGER.fdebug('targets: %s', _this._targetsInProcess);
                        LOGGER.timeEnd('[t] Build total for "%s"', id);
                    });
                })

                // not found or successfully build, try to find path on disk
                .then(_this.processPath(response, fullPath, root))

                // any error, 500 internal server error
                .fail(_this.httpError(response, 500));

        };

    },

    processPath: function(response, path, root) {
        var _this = this;

        return function() {

            return QFS.exists(path).then(function(exists) {

                // 404 not found
                if (!exists) {
                    return _this.httpError(response, 404)(path);
                }

                // found, process file/directory
                return QFS.isDirectory(path).then(function(isDir) {

                    if (isDir) {

                        // TODO: make defaultDocument buildable
                        var def = PATH.join(path, defaultDocument);
                        return QFS.isFile(def).then(function(isFile) {
                            if (isFile) return _this.streamFile(response, def)();
                            return _this.processDirectory(response, path, root)();
                        });

                    }

                    return _this.streamFile(response, path)();

                });

            });

        };
    },

    processDirectory: function(response, path, root) {
        var _this = this;

        return function() {
                response.status = 200;
                response.charset = 'utf8';
                response.headers = { 'content-type': 'text/html' };

                var body = response.body = [],
                    base = '/' + PATH.relative(root, path);

                _this.pushFormatted(body,
                    '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>%s</title></head>' +
                        '<body><b>Index of %s</b><ul style=\'list-style-type: none\'>',
                    path, path);

                var files = [],
                    dirs = ['..'];

                body.push(U.getDirsFiles(path, dirs, files).then(function() {
                    var listing = [],
                        pushListing = function(objs, str) {
                            objs.sort();
                            objs.forEach(function(o) {
                                _this.pushFormatted(listing, str, PATH.join(base, o), o);
                            });
                        };

                    pushListing(dirs, '<li><a href="%s">/%s</a></li>');
                    pushListing(files, '<li><a href="%s">%s</a></li>');

                    return listing.join('');
                }));

                body.push('</ul></body></html>');

                return response;
        };
    },

    streamFile: function(response, path) {

        return function() {

            response.status = 200;
            response.charset = 'binary';
            response.headers = { 'content-type': MIME.lookup(path) };
            response.body = QFS.open(path, 'b');

            return response;
        };
    },

    httpError: function(response, code) {
        return function(err) {
            LOGGER.fwarn('*** HTTP error: %s, %s', code, (err && err.stack) || err);

            response.status = code;
            response.charset = 'utf8';
            response.headers = { 'content-type': 'text/html' };
            response.body = ['<h1>HTTP error ' + code + '</h1>'].concat(err? ['<pre>', '' + (err.stack || err), '</pre>'] : []);

            return response;
        };
    },

    pushFormatted: function(arr/*, str*/) {
        arr.push(UTIL.format.apply(UTIL, Array.prototype.slice.call(arguments, 1)));
        return arr;
    }
});
