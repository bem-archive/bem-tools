var Q = require('q'),
    QFS = require('q-fs'),
    QHTTP = require('q-http'),
    QS = require('querystring'),
    UTIL = require('util'),
    PATH = require('./path'),
    MAKE = require('./make');

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
        return QFS.exists(root, function(exists) {
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
            return new MAKE.Runner(graph, opts.jobs, {
                verbose: opts.verbose,
                force: opts.force
            });
        })
    }
}

function requestHandler(root, runner) {

    return function(request, response) {

        var relPath = QS.unescape(request.path).replace(/^\//, ''),
            fullPath = PATH.join(root, relPath);

        console.log(UTIL.format('trying to access %s', fullPath));

        // try to find node in graph
        return findNode(runner, relPath)()
            .then(function(id) {
                // found, run build
                return runner.process(id)
                    // build successfull, process file/directory
                    .then(processPath(response, fullPath))
                    // build failed, 500 internal server error
                    .fail(httpError(response, 500));
            })
            .fail(function() {
                // not found, try to find file on disk
                return QFS.exists(fullPath).then(function(exists) {
                    // found, process file/directory
                    if (exists) {
                        return processPath(response, fullPath)();
                    }
                    // 404 not found
                    return httpError(response, 404)();
                });
            });

    };

}

function findNode(runner, id) {
    return function() {
        return runner.findNode(id).then(function(id) {
            if (id) return id;
            return Q.reject();
        });
    }
}

function processPath(response, path) {
    // TODO: process directory
    return streamFile(response, path);
}

function streamFile(response, path) {
    return function() {

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
        response.body = err? ['<pre>', '' + (err.stack || err), '</pre>'] : ['HTTP error ' + code];

        return response;
    }
}
