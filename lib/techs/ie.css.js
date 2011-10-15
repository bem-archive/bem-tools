var ieCSS = require('./css.js'),
    myPath = require('bem/lib/path'),
    fs = require('fs'),
    bemUtil = require('bem/lib/util');

for (var n in css) exports[n] = css[n];

exports.techModule = module;

exports.bemBuildContent = function(prefixes, suffixes, outputDir) {

    var files = [];

    prefixes.forEach(function (prefix) {
        suffixes.forEach(function (suffix) {
            var file = prefix + '.' + suffix;
            bemUtil.isFile(file) && files.push(file);
        });
    });

    return files
        .map(function (file) {
            return exports.outFile(myPath.relative(outputDir, file));
        })
    .join('');

};

exports.bemBuild = function(prefixes, outputDir, outputName) {

    var prefix = myPath.join(outputDir, outputName),
        cssName = prefix + '.css';

    exports.write(
        prefix + '.ie.css',
        this.outFile(myPath.relative(outputDir, cssName)) +
        exports.bemBuildContent(prefixes, ['hover.ie.css', 'ie.css'], outputDir));

    return this;

};

exports.write = function(file, content) {
    fs.createWriteStream(file, { encoding: 'utf8' }).write(content);
};
