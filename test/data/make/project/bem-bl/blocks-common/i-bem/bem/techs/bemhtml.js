var BEM = require('bem'),
    Q = BEM.require('q'),
    PATH = require('path'),
    SYS = require('util'),
    FS = require('fs'),
    XJST = require('xjst');

exports.getBuildResultChunk = function(relPath, path, suffix) {

    return [
        '/* ' + path + ': start */',
        FS.readFileSync(path),
        '/* ' + path + ': end */',
        '\n'
    ].join('\n');

};

exports.getBuildResult = function(prefixes, suffix, outputDir, outputName) {

    var _this = this;
    return this.filterPrefixes(prefixes, ['bemhtml'])
        .then(function(paths) {
            return Q.all(paths.map(function(path) {
                return _this.getBuildResultChunk(
                    PATH.relative(outputDir, path), path, suffix);
            }));
        })
        .then(function(sources) {
            sources = sources.join('\n');

            var BEMHTML = require('../../__html/lib/bemhtml.js');
            try {
                var tree = BEMHTML.BEMHTMLParser.matchAll(
                    sources,
                    'topLevel',
                    undefined,
                    function(m, i) {
                        console.log(arguments);
                        throw { errorPos: i, toString: function() { return "bemhtml match failed" } }
                    });

                var xjstSources = BEMHTML.BEMHTMLToXJST.match(
                    tree,
                    'topLevel',
                    undefined,
                    function(m, i) {
                        console.log(arguments);
                        throw { toString: function() { return "bemhtml to xjst compilation failed" } };
                    });
            } catch (e) {
                e.errorPos != undefined &&
                    SYS.error(
                        sources.slice(0, e.errorPos) +
                        "\n--- Parse error ->" +
                        sources.slice(e.errorPos) + '\n');
                console.log('error: ' + e);
                throw e;
            }

            try {
                var xjstTree = XJST.parse(xjstSources);
            } catch (e) {
                throw new Error("xjst parse failed");
            }

            try {
                var xjstJS = process.env.BEMHTML_ENV == 'development' ?
                    XJST.XJSTCompiler.match(xjstTree, 'topLevel') :
                    XJST.compile(xjstTree);
            } catch (e) {
                throw new Error("xjst to js compilation failed");
            }

            // TODO: поддержать работу с шаблоном как с CommonJS-модулем, через `BEMHTML = require('tpl.bemhtml.js').apply`
            return 'var BEMHTML = ' + xjstJS + ';BEMHTML = (function(xjst) { return function() { return xjst.apply.call([this]); }; }(BEMHTML));';

        });

};

exports.storeBuildResults = function(prefix, res) {
    var _this = this,
        suffix = 'bemhtml.js';
    return Q.when(res, function(res) {
        return _this.storeBuildResult(_this.getPath(prefix, suffix), suffix, res['bemhtml']);
    });
};

exports.getSuffixes = function() {
    return ['bemhtml'];
};

exports.getDependencies = function() {
    return ['deps.js'];
};
