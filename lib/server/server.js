var util = require('util'),
    http = require('http'),
    bemutil = require('../util'),
    q = require('q'),
    qw = require('q-wrap'),
    path = require('../path'),
    fs = require('fs'),
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

    console.log(util.format('attempting to access %s', filePath));

    if(filePath.match(/.*\.html$/i) && bemFilesExist(filePath)) {
        console.log('requested file will be generated from bemjson and bemhtml');
        processBEMHTML(filePath, res);
    } else if(filePath.match(/_.*\.(js|css)$/i)) {
        console.log('requested file will be processed with borschik');
        processBorschik(filePath, res);
    } else {
        q.when(qw.execute(fs.stat, filePath),
            function(stat) {
                if(stat.isDirectory()) {
                    processDirectory(filePath, res);
                } else {
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
                }
            },
            function(err) {
                res.writeHead(404);
                res.end();
            });
    }
}

function processDirectory(dirpath, res) {
    var items = [];

    res.write(util.format('<!DOCTYPE html><html><head><meta charset="utf-8"/><title>%s</title></head>', dirpath));
    res.write(util.format('<body><b>Index of %s</b><ul style=\'list-style-type: none\'>', dirpath));

    q.when(qw.execute(fs.readdir, dirpath),
        function(f) {
            var files = [],
                dirs = ['..'];

            console.dir(f);

            f && f.forEach(function(item) {
                if(bemutil.isDirectory(path.join(dirpath, item))) {
                    dirs.push(item);
                    console.log('dir ' + item);
                }
                else {
                    files.push(item);
                    console.log('file ' + item);
                }
            });

            dirs.sort();
            files.sort();

            dirs.forEach(function(dir){
                res.write(util.format('<li><a href=\'%s/\'>/%s</a></li>', dir, dir));
            });

            files.forEach(function(file){
                res.write(util.format('<li><a href=\'%s\'>%s</a></li>', file, file));
            });

            res.end('</ul></body></html>');
        },
        function(error) {
            res.end(error.message);
        });

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