var util = require('util'),
    http = require('http'),
    bemutil = require('../util'),
    q = require('q'),
    path = require('../path'),
    url = require('url'),
    vm = require('vm'),
    bk = require('borschik').api;

var root;

exports.start = function(opts) {

    root = opts.project;

    bemutil.isExists(root)
        .then(function(exists) {
            if(exists) {
                root = path.resolve(root);

                console.log(util.format('project root is %s', root));
                console.log(util.format("server is starting on port %s", opts.port));

                var server = http.Server(
                    function(req, res) {
                        handleRequest(req, res);
                    }).on('error',
                    function(e) {
                        console.log(util.format('Ошибка инициализации сервера: %s', e.message));
                    }).listen(opts.port);

            } else {
                console.log(util.format('%s не существует', root));
            }
        });
}

function handleRequest(req, res) {

    var query = url.parse(req.url, true),
        relUri = query.pathname,
        filePath = path.join(root, relUri);

    console.log(util.format('attempting to access file %s', filePath));

    if(filePath.match(/.*\.html$/i) && bemFilesExist(filePath)) {
        console.log('requested file will be generated from bemjson and bemhtml');
        processBEMHTML(filePath, res);
    } else if(filePath.match(/_.*\.(js|css)$/i)) {
        console.log('requested file will be processed with borschik');
        processBorschik(filePath, res);
    } else {
        bemutil.isExists(filePath)
            .then(function(exists) {
                if(!exists) {
                    res.writeHead(404);
                    res.end();
                    return;
                }

                bemutil.readFile(filePath)
                    .then(function(content) {
                        res.writeHead(200);
                        res.end(content);
                    })
                    .fail(function(error) {
                        console.log(error.stack);
                        res.writeHead(500);
                        res.end(error.message);
                    });
            });
    }
}

function bemFilesExist(file) {
    var bemhtmlFile = file.replace(/html$/i, 'bemhtml.js'),
        bemjsonFile = file.replace(/html$/i, 'bemjson.js');

    return bemutil.isFile(bemhtmlFile) && bemutil.isFile(bemjsonFile);
}

function processBEMHTML(htmlFile, res) {

    var bemhtmlFile = htmlFile.replace(/html$/i, 'bemhtml.js'),
        bemjsonFile = htmlFile.replace(/html$/i, 'bemjson.js');

    console.log(util.format('reading bemhtml %s and bemjson %s', bemhtmlFile, bemjsonFile));

    bemutil.readFile(bemhtmlFile)
        .then(function(bemhtml) {
            return bemutil.readFile(bemjsonFile)
                .then(function(bemjson) {
                    try {
                        vm.runInThisContext(bemhtml);
                        var html = BEMHTML.apply(vm.runInThisContext(bemjson));
                        res.writeHead(200);
                        res.end(html);
                    } catch(e) {
                        console.log(util.format('error occured during bemjson processing: %s', e));
                        res.writeHead(500);
                        res.end(util.format('error occured during bemjson processing: %s', e));
                    }
                })
        })
        .fail(function(error) {
            res.writeHead(500);
            res.end(error.message);
        });
}

function processBorschik(file, res) {

    var options = {
        input : file,
        output : res
    };

    if(file.match(/\.css$/i)) options.tech = 'css';

    q.when(bk(null,
        options),
        function() {
            res.end();
        },
        function(error) {
            console.log(error.stack);
            res.writeHead(500);
            res.end(error.message);
        });
}