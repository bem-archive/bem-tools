var Q = require('q'),
    QFS = require('q-fs'),
    QHTTP = require('q-http'),
    QS = require('querystring'),
    UTIL = require('util'),
    PATH = require('./path'),
    MAKE = require('./make');

var defaultDocument = 'index.html';

exports.start = function(opts) {

    return rootExists(opts.root)()
        .then(showInfo(opts))
        .then(initBuildRunner(opts))
        .then(startServer(opts.root, opts.port, opts.hostname))
        .then(function(s) {
            return s.stopped;
        });

};

function showInfo(opts) {
    return function() {
        console.log(UTIL.format("Project root is '%s'", opts.root));
        console.log(UTIL.format('Options are %j', opts));
    }
}

function rootExists(root) {

    return function() {
        return QFS.exists(root).then(function(exists) {
            if (!exists) return Q.reject(UTIL.format("Project root '%s' doesn't exist", root));
        });
    }

}

function startServer(root, port, hostname) {

    return function(runner) {
        var server = QHTTP.Server(requestHandler(root, runner));
        return server.listen(port, hostname).then(function() {
            console.log(UTIL.format('Server is listening on port %s', port));
            return server;
        });
    }

}

function initBuildRunner(opts) {
    return function() {
        return Q.when(MAKE.createGraph(opts.root), function(graph) {
            return new MAKE.Runner(graph, opts.workers, {
                root: opts.root,
                verbose: opts.verbose,
                force: opts.force
            });
        })
    }
}

function requestHandler(root, runner) {

    return function(request, response) {

        var relPath = QS.unescape(request.path).replace(/^\/|\/$/g, ''),
            fullPath = PATH.join(root, relPath);

        console.log(UTIL.format('*** trying to access %s', fullPath));

        // try to find node in graph
        console.log(UTIL.format('*** searching for node "%s"', relPath));
        return runner.findNode(relPath)
            .fail(function(){})
            .then(function(id) {
                if (!id) return;

                // found, run build
                console.log(UTIL.format('*** found, building "%s"', id));
                return runner.process(id);
            })

            // not found or successfully build, try to find path on disk
            .then(processPath(response, fullPath))

            // any error, 500 internal server error
            .fail(httpError(response, 500));

    };

}

function processPath(response, path) {
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
                        return processDirectory(response, path)();
                    });

                }

                return streamFile(response, path)();

            });

        });

    }
}

function processDirectory(response, path) {
    return function() {
        return QFS.list(path).then(function(list) {
            response.status = 200;
            response.charset = 'utf8';

            var body = response.body = [];

            pushFormatted(body,
                '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>%s</title></head>' +
                    '<body><b>Index of %s</b><ul style=\'list-style-type: none\'>',
            path);

            var files = [],
                dirs = ['..'],
                fillArrays = Q.all(list
                    .map(function(i) {
                        return QFS.isDirectory(PATH.join(path, i))
                            .then(function(isDir) {
                                if (isDir) dirs.push(i);
                                else files.push(i);
                            });
                    }));

            body.push(fillArrays.then(function() {
                var listing = [];

                dirs.sort();
                files.sort();

                dirs.forEach(function(dir) {
                    pushFormatted(listing, '<li><a href="%s/">/%s</a></li>', dir, dir);
                });

                files.forEach(function(file) {
                    pushFormatted(listing, '<li><a href="%s">%s</a></li>', file, file);
                });

                return listing.join('');
            }));

            body.push('</ul></body></html>');

            return response;
        });
    }
}

function streamFile(response, path) {
    return function() {

        // FIXME: content-type
        response.status = 200;
        response.charset = 'binary';
        response.body = QFS.open(path);

        return response;
    }
}

function httpError(response, code) {
    return function(err) {
        console.error('*** HTTP error: %s, %s', code, (err && err.stack) || err);

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
