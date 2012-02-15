var util = require('util');
var http = require('http');
var bemutil = require('../util');
var q = require('q');
var path = require('../path');
var url = require('url');
var vm = require('vm');

var root = '.';

exports.start = function (opts) {
    var port = 8080;

    if (opts.port) {
        port = opts.port;
    }

    if (opts.project) {
        root = opts.project;
    }

    bemutil.isExists(root).then(function (exists) {

        if (exists) {
            root = path.resolve(root);

            readProject(root)
                .then(function (project) {
                    console.log(project);

                    console.log(util.format('project root is %s', root));
                    console.log(util.format("server is starting on port %s", port));

                    var server = http.Server(
                        function (req, res) {
                            handleRequest(req, res);
                        }).on('error',
                        function (e) {
                            console.log(util.format('Ошибка инициализации сервера: %s', e.message));
                        }).listen(port);
                })
                .fail(function (error) {
                    console.log('can\'t read project file: ' + error);
                });


        } else {
            console.log(util.format('%s не существует', root));
        }
    });

}

function readProject(root) {
    var project = path.join(root, 'project.bs.js');

    return bemutil.readFile(project)
        .then(function (content) {
            return JSON.parse(content);
        })
        .fail(function (error) {

        });
}

function handleRequest(req, res) {

    var query = url.parse(req.url, true);
    var relUri = query.pathname;
    var filePath = path.join(root, relUri);

    console.log(util.format('attempting to access file %s', filePath));

    if (filePath.match(/_.*\.html$/i)) {
        console.log('requested file will be generated from bemjson and bemhtml');
        processBEMHTML(filePath, res);
    } else {

        bemutil.isExists(filePath)
            .then(function (exists) {

                if (!exists) {
                    res.writeHead(404);
                    res.end();
                    return;
                }

                bemutil.readFile(filePath)
                    .then(function (content) {
                        res.writeHead(200);
                        res.end(content);
                    })
                    .fail(function (error) {
                        console.log(error);
                        res.writeHead(500);
                        res.end(error.message);
                    });
            });
    }
}

function processBEMHTML(htmlFile, res) {
    var bemhtmlFile = htmlFile.replace(/html$/i, 'bemhtml.js');
    var bemjsonFile = htmlFile.replace(/html$/i, 'bemjson.js');

    console.log(util.format('reading bemhtml %s and bemjson %s', bemhtmlFile, bemjsonFile));

    bemutil.readFile(bemhtmlFile)
        .then(function (bemhtml) {
            return bemutil.readFile(bemjsonFile)
                .then(function (bemjson) {

                    try {
                        vm.runInThisContext(bemhtml);
                        var html = BEMHTML.apply(vm.runInThisContext(bemjson));
                        res.writeHead(200);
                        res.end(html);
                    } catch (e) {
                        console.log(util.format('error occured during bemjson processing: %s', e));
                        res.writeHead(500);
                        res.end(util.format('error occured during bemjson processing: %s', e));
                    }
                })
        })
        .fail(function (error) {
            res.writeHead(500);
            res.end(error.message);
        });
}