var old = require('path');
for(var i in old) exports[i] = old[i];

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

exports.relative = function(from, to) {
    from = exports.absolute(from).split(dirSep);
    to = exports.absolute(to).split(dirSep);
    from.pop();
    while(from.length && to.length && to[0] == from[0]) {
        from.shift();
        to.shift();
    }
    while(from.length) {
        from.shift();
        to.unshift('..');
    }
    return to.join(dirSep);
};

exports.unixToOs = function(path) {
    return path.replace(/\//g, dirSep);
};
