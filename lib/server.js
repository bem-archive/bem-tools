'use strict';

var INHERIT = require('inherit'),
    QFS = require('q-io/fs'),
    QHTTP = require('q-io/http'),
    PATH = require('./path'),
    LOGGER = require('./logger'),
    U = require('./util'),

    Server = require('./base-server').Server;

exports.Server = INHERIT(Server, {

    startServer: function(requestHandler) {
        var _this = this,
            started = this.opts.socketOnly? []: this.__base(requestHandler);

        if (!(_this.opts.socket || _this.opts.socketOnly)) return started;

        // Start server on unix socket
        var sockServer = QHTTP.Server(requestHandler);

        sockServer.node.on('error', this.errorHandler.bind(this, this.opts.socketPath));

        U.mkdirs(PATH.dirname(_this.opts.socketPath));

        started.push(sockServer.listen(_this.opts.socketPath).then(function(listener) {

            // Remove unix socket on server stop
            sockServer.stopped.fin(function() {
                return QFS.remove(_this.opts.socketPath);
            });

            // Change permissions of unix socket on server start
            return QFS.chmod(_this.opts.socketPath, _this.opts.socketMode)
                .then(function() {
                    LOGGER.finfo('Server is listening on unix socket %s', _this.opts.socketPath);

                    return listener;
                });

        }));

        return started;
    }
});

