var ieCSS = require('./css.js'),
    myPath = require('bem/lib/path');
for (var n in ieCSS) {
    console.log(n, ieCSS[n]);
    exports[n] = ieCSS[n];
}

var ieCSStmp = exports.bemBuildContent;

exports.bemBuild = function (prefixes, outputDir, outputName) {

    var prefix = myPath.join(outputDir, outputName),
        cssName = prefix + '.css';

    exports.write(
            prefix + '.ie.css',
            this.outFile(myPath.relative(outputDir, cssName)) +
            exports.bemBuildContent(prefixes, ['hover.ie.css', 'ie.css'], outputDir));

    return this;

};
