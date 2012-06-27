var Q = require('q'),
    QFS = require('q-fs'),
    QHTTP = require('q-http'),
    QS = require('querystring'),
    UTIL = require('util'),
    URL = require('url'),
    MIME = require('mime'),
    PATH = require('./path'),
    MAKE = require('./make'),
    LOGGER = require('./logger'),
    U = require('./util');

var defaultDocument = 'index.html';

exports.start = function(opts) {

    return rootExists(opts.root)()
        .then(showInfo(opts))
        .then(initBuildRunner(opts))
        .then(startServers(opts))
        .then(function(servers) {
            return Q.all(servers.map(function(s) {
                return s.stopped;
            }));
        })
        .then(function() {
            LOGGER.info('Servers were stopped');
        });

};

function showInfo(opts) {
    return function() {
        LOGGER.finfo("Project root is '%s'", opts.root);
        LOGGER.fverbose('Options are %j', opts);
    }
}

function rootExists(root) {

    return function() {
        return QFS.exists(root).then(function(exists) {
            if (!exists) return Q.reject(UTIL.format("Project root '%s' doesn't exist", root));
        });
    }

}

function startServers(opts) {

    return function(runner) {

        var requestHandler = createRequestHandler(opts.root, runner),
            netServer = QHTTP.Server(requestHandler),
            started = [];

        // Start server on net socket
        started.push(netServer.listen(opts.port, opts.host).then(function() {
            LOGGER.finfo('Server is listening on port %s. Point your browser to http://localhost:%s/', opts.port, opts.port);
            return netServer;
        }));

        // Start server on unix socket
        if (opts.socket) {

            var sockServer = QHTTP.Server(requestHandler);

            U.mkdirs(PATH.dirname(opts.socketPath));

            started.push(sockServer.listen(opts.socketPath).then(function() {

                // Remove unix socket on server stop
                sockServer.stopped.fin(function() {
                    return QFS.remove(opts.socketPath);
                });

                // Change permissions of unix socket on server start
                return QFS.chmod(opts.socketPath, opts.socketMode)
                    .then(function() {
                        LOGGER.finfo('Server is listening on unix socket %s', opts.socketPath);
                        return sockServer;
                    });

            }));

        }

        return Q.all(started)
            .then(function(servers) {

                // Stop all servers on Control + C
                servers.forEach(function(server) {
                    process.once('SIGINT', stopServer(server));
                });

                return servers;

            });

    }

}

function stopServer(server) {
    return function() {
        server.stop();
    }
}

function initBuildRunner(opts) {
    return function() {
        return Q.when(MAKE.createArch(opts.root), function(arch) {
            return new MAKE.APW(arch, opts.workers, {
                root: opts.root,
                verbose: opts.verbose,
                force: opts.force
            });
        })
    }
}

function createRequestHandler(root, runner) {

    return function(request, response) {

        var reqPath = URL.parse(request.path).pathname,
            relPath = QS.unescape(reqPath).replace(/^\/|\/$/g, ''),
            fullPath = PATH.join(root, relPath);

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

                // found, run build
                LOGGER.fverbose('*** node found, building "%s"', id);
                LOGGER.time('[t] Build total for "%s"', id);
                return runner.process(id).fin(function() {
                    LOGGER.timeEnd('[t] Build total for "%s"', id);
                });
            })

            // not found or successfully build, try to find path on disk
            .then(processPath(response, fullPath, root))

            // any error, 500 internal server error
            .fail(httpError(response, 500));

    };

}

function processPath(response, path, root) {
    return function() {

        return QFS.exists(path).then(function(exists) {

            // 404 not found
            if (!exists) {
                return httpError(response, 404)(path);
            }

            // found, process file/directory
            return QFS.isDirectory(path).then(function(isDir) {

                if (isDir) {

                    // TODO: make defaultDocument buildable
                    var def = PATH.join(path, defaultDocument);
                    return QFS.isFile(def).then(function(isFile) {
                        if (isFile) return streamFile(response, def)();
                        return processDirectory(response, path, root)();
                    });

                }

                return streamFile(response, path)();

            });

        });

    }
}

function processDirectory(response, path, root) {
    return function() {
        return QFS.list(path).then(function(list) {
            response.status = 200;
            response.charset = 'utf8';
            response.headers = { 'content-type': 'text/html' };

            root = PATH.join(root, '/');

            var body = response.body = [],
                base = '/' + PATH.relative(root, path);

            pushFormatted(body,
                '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>%s</title></head>' +
                    '<body><b>Index of %s</b><ul style=\'list-style-type: none\'>',
                path, path);

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
                var listing = [],
                    pushListing = function(objs, str) {
                        objs.sort();
                        objs.forEach(function(o) {
                            pushFormatted(listing, str, PATH.join(base, o), o);
                        });
                    };

                pushListing(dirs, '<li><a href="%s">/%s</a></li>');
                pushListing(files, '<li><a href="%s">%s</a></li>');

                return listing.join('');
            }));

            body.push('</ul></body></html>');

            return response;
        });
    }
}

function streamFile(response, path) {
    return function() {

        response.status = 200;
        response.charset = 'binary';
        response.headers = { 'content-type': MIME.lookup(path) };
        response.body = QFS.open(path);

        return response;
    }
}

function httpError(response, code) {
    return function(err) {
        LOGGER.fwarn('*** HTTP error: %s, %s', code, (err && err.stack) || err);

        response.status = code;
        response.charset = 'utf8';
        response.headers = { 'content-type': 'text/html' };
        response.body = ['<h1>HTTP error ' + code + '</h1>'].concat(err? ['<pre>', '' + (err.stack || err), '</pre>'] : []);

        return response;
    }
}

function pushFormatted(arr, str) {
    arr.push(UTIL.format.apply(UTIL, Array.prototype.slice.call(arguments, 1)));
    return arr;
}
