var INHERIT = require('inherit'),
    Q = require('q'),
    QFS = require('q-fs'),
    QS = require('querystring'),
    UTIL = require('util'),
    URL = require('url'),
    PATH = require('./path'),
    MAKE = require('./make'),
    LOGGER = require('./logger'),
    SERVER = require('./server').server,
    U = require('./util');

var assetsRoot = PATH.resolve(__dirname, 'data');

exports.server = INHERIT(SERVER, {

    __constructor: function(opts) {
        this.__base(opts);

        this.port = opts.archport;
        delete this.socket;
    },

    start: function() {

        return this.rootExists(this.root)()
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
                    base = '/' + PATH.relative(root, path);

                var files = [],
                    dirs = ['..'],
                    fillArrays = Q.all(list
                        .map(function(i) {
                            return QFS.isDirectory(PATH.join(path, i))
                                .then(function(isDir) {
                                    (isDir ? dirs : files).push(i);
                                });
                        }));

                body.push(fillArrays.then(function() {
                    return JSON.stringify(files);
                }));

                return response;
            });
        }
    }
});
