var INHERIT = require('inherit'),
    Q = require('q'),
    QFS = require('q-fs'),
    QS = require('querystring'),
    QHTTP = require('q-http'),
    UTIL = require('util'),
    URL = require('url'),
    PATH = require('./path'),
    MAKE = require('./make'),
    LOGGER = require('./logger'),
    Server = require('./base-server').Server,
    U = require('./util');

var assetsRoot = PATH.resolve(__dirname, 'data');

exports.Server = INHERIT(Server, {

    start: function() {

        return this.rootExists(this.opts.root)()
            .then(this.showInfo())
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

    startServer: function(requestHandler) {
        var _this = this,
            netServer = QHTTP.Server(requestHandler),
            started = [];

        netServer.node.on('error', this.errorHandler.bind(this, this.opts['inspector-port']));

        // Start server on net socket
        started.push(netServer.listen(_this.opts['inspector-port'], _this.opts.host).then(function(listener) {

            LOGGER.finfo('Inspector server is listening on port %s. Point your browser to http://localhost:%s/',
                _this.opts['inspector-port'],
                _this.opts['inspector-port']);

            return listener;
        }));

        return started;
    },

    createRequestHandler: function(root, runner) {
        var _this = this;

        return function(request, response) {

            var reqPath = URL.parse(request.path).pathname,
                relPath = QS.unescape(reqPath).replace(/^\/|\/$/g, ''),
                fullPath = PATH.join(reqPath.toLowerCase().indexOf('/snapshots') === 0? PATH.join(root, '.bem'):assetsRoot, relPath);

            LOGGER.fverbose('*** trying to access %s (%s)', fullPath, reqPath);

            return _this.processPath(response, fullPath, root)();

        };

    },

    processDirectory: function(response, path, root) {
        return function() {
            return QFS.list(path).then(function(list) {
                response.status = 200;
                response.charset = 'utf8';
                response.headers = { 'content-type': 'text/json' };

                root = PATH.join(root, '/');

                var body = response.body = [],
                    files = [],
                    dirs = [];

                body.push(U.getDirsFiles(path, dirs, files).then(function() {
                    return JSON.stringify(files);
                }));

                return response;
            });
        }
    }
});
