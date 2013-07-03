'use strict';

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

/**
 * Extension to the PATH.relative() function to add `./` to the
 * start of relative path if `dot` flag equals to `true`.
 *
 * @param {String} from
 * @param {String} to
 * @param {Boolean} dot
 * @return {String}
 */
exports.relative = function(from, to, dot) {
    var path = PATH.relative(from, to);
    if (dot && !new RegExp('^\\.{1,2}' + dirSepRe).test(path)) {
        path = '.' + dirSep + path;
    }
    return path;
};

exports.absolute = function(path, startDir) {
    return exports.isAbsolute(path) ?
        path :
        exports.normalize(exports.join(startDir || process.cwd(), path));
};

exports.unixToOs = function(path) {
    return path.replace(/\//g, dirSep);
};

exports.joinPosix = function() {
    var paths = Array.prototype.slice.call(arguments, 0);
    return exports.normalizePosix(paths.filter(function(p) {
        return p && typeof p === 'string';
    }).join('/'));
};

exports.normalizePosix = function(path) {
    var isAbsolute = path.charAt(0) === '/',
        trailingSlash = path.slice(-1) === '/';

    // Normalize the path
    path = normalizeArray(path
        .split('/')
        .filter(function(p) {
            return !!p;
        }), !isAbsolute).join('/');

    if (!path && !isAbsolute) {
        path = '.';
    }
    if (path && trailingSlash) {
        path += '/';
    }

    return (isAbsolute ? '/' : '') + path;
};

// Support compatability with node 0.6.x and remove warnings on node 0.8.x
exports.exists = FS.exists || PATH.exists;
exports.existsSync = FS.existsSync || PATH.existsSync;

function normalizeArray(parts, allowAboveRoot) {
    // if the path tries to go above the root, `up` ends up > 0
    var up = 0;
    for (var i = parts.length - 1; i >= 0; i--) {
        var last = parts[i];
        if (last === '.') {
            parts.splice(i, 1);
        } else if (last === '..') {
            parts.splice(i, 1);
            up++;
        } else if (up) {
            parts.splice(i, 1);
            up--;
        }
    }

    // if the path is allowed to go above the root, restore leading ..s
    if (allowAboveRoot) {
        for (; up--; up) {
            parts.unshift('..');
        }
    }

    return parts;
}
