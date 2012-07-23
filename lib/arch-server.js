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

var defaultDocument = 'index.html',
    root = PATH.resolve(__dirname, 'data'),
    projectRoot;

exports.start = function(opts) {

    projectRoot = opts.root;

    return rootExists(root)()
        .then(showInfo(opts))
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

        var requestHandler = createRequestHandler(root, runner),
            netServer = QHTTP.Server(requestHandler),
            started = [];

        // Start server on net socket
        started.push(netServer.listen(opts.archport, opts.host).then(function() {
            LOGGER.finfo('Arch server is listening on port %s. Point your browser to http://localhost:%s/', opts.archport, opts.archport);
            return netServer;
        }));

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

function createRequestHandler(root, runner) {

    return function(request, response) {

        var reqPath = URL.parse(request.path).pathname,
            relPath = QS.unescape(reqPath).replace(/^\/|\/$/g, ''),
            fullPath = PATH.join(reqPath.toLowerCase().indexOf('/snapshots') === 0? PATH.join(projectRoot, '.bem'):root, relPath);

        LOGGER.fverbose('*** trying to access %s (%s)', fullPath, reqPath);

        // try to find node in arch
        LOGGER.fverbose('*** searching for node "%s"', relPath);
        return processPath(response, fullPath, root, reqPath)

//            // any error, 500 internal server error
            .fail(httpError(response, 500));

    };

}

function processPath(response, path, root, reqPath) {
//    if (reqPath && reqPath.toLowerCase().indexOf('/snapshots') === 0) {
//        //path = PATH.join(projectRoot, '.bem/snapshots');
//        root = PATH.join(projectRoot, '.bem');
//    }

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
                    return processDirectory(response, path, root, true)();
                });

            }

            return streamFile(response, path)();

        });

    });
}

function processDirectory(response, path, root, json) {
    return function() {
        return QFS.list(path).then(function(list) {
            response.status = 200;
            response.charset = 'utf8';
            response.headers = { 'content-type': json? 'text/json': 'text/html' };

            root = PATH.join(root, '/');

            var body = response.body = [],
                base = '/' + PATH.relative(root, path);

            if (!json) pushFormatted(body,
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
                if (!json) {
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
                } else return JSON.stringify(files);
            }));

            if (!json) body.push('</ul></body></html>');

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
