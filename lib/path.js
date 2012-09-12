var FS = require('fs'),
    PATH = require('path');
for(var i in PATH) exports[i] = PATH[i];

var isWindows = exports.isWindows = process.platform === 'win32',
    dirSep = exports.dirSep = isWindows? '\\' : '/',
    dirSepRe = exports.dirSepRe = isWindows? '\\\\' : '/';
exports.pathSep = isWindows? ';' : ':';

exports.isAbsolute = function(path) {
    var re = new RegExp('^([a-zA-Z]:)?' + dirSepRe);
    return path.match(re);
};

exports.isRoot = function(path) {
    var re = new RegExp('^([a-zA-Z]:)?' + dirSepRe + '$');
    return path.match(re);
};

exports.absolute = function(path, startDir) {
    return exports.isAbsolute(path) ?
        path :
        exports.normalize(exports.join(startDir || process.cwd(), path));
};

exports.unixToOs = function(path) {
    return path.replace(/\//g, dirSep);
};

// Support compatability with node 0.6.x and remove warnings on node 0.8.x
exports.exists = FS.exists || PATH.exists;
exports.existsSync = FS.existsSync || PATH.existsSync;
