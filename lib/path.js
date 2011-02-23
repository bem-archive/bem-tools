var old = require('path');
for(var i in old) exports[i] = old[i];

exports.isAbsolute = function(path) {
    return path.indexOf('/') == 0;
};

exports.absolute = function(path, startDir) {
    return exports.isAbsolute(path) ?
        path :
        exports.normalize(exports.join(startDir || process.cwd(), path));
};

exports.relative = function(from, to) {
    from = exports.absolute(from).split('/');
    to = exports.absolute(to).split('/');
    from.pop();
    while(from.length && to.length && to[0] == from[0]) {
        from.shift();
        to.shift();
    }
    while(from.length) {
        from.shift();
        to.unshift('..');
    }
    return to.join('/');
};
